"use strict";
const url  = require('url');
const queryString = require('querystring');
const kanbanGOInitialization = require('./resources_kanban_go_initialization');
const pathnames = require('./pathnames');
const childProcess = require("child_process");
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
require('colors');

/**
 * Returns the ambient kanbanGOInitializer.
 * @returns {KanbanGoInitializer}
 */
function getInitializer() {
  return global.kanban.kanbanGOInitializer;
}

function NodeKanbanGo(inputId) {
  this.id = inputId;
  this.idNetwork = 211;
  this.notes = "";
  this.fileNameNodeAddress = null;
  this.ethereumAddress = null;
  this.dataDir = `${getInitializer().paths.nodesDir}/node${this.id}`;
  this.lockFileName = `${this.dataDir}/geth/LOCK`;
  this.keyStoreFolder = `${this.dataDir}/keystore`;
  this.port = this.id + 40107;
  this.RPCPort = this.id + 4007;
  this.flagPreviouslyInitialized = true;
  this.flagFoldersInitialized = false;
  this.numberAttemptsToSelectAddress = 0;
  this.maximumAttemptsToSelectAddress = 4;
}

NodeKanbanGo.prototype.initializeFoldersAndKeys = function(response) {
  fs.unlink(this.lockFileName, this.initialize2ReadKeyStore.bind(this, response));
}

NodeKanbanGo.prototype.initialize2ReadKeyStore = function(response, error) {
  fs.readdir(this.keyStoreFolder, this.initialize3SelectAddress.bind(this, response));
}

NodeKanbanGo.prototype.initialize3SelectAddress = function(response, error, fileNames) {
  if (error !== null && error !== undefined) {
    this.notes += `Error reading key store directory: ${this.keyStoreFolder}. ${error}<br>\n`;
    this.flagFoldersWereInitialized = false;
  }
  this.numberAttemptsToSelectAddress ++;
  if (this.numberAttemptsToSelectAddress > this.maximumAttemptsToSelectAddress) {
    this.notes += `${this.numberAttemptsToSelectAddress} failed attempts to select address: aborting.<br>\n`;
    getInitializer().runNodes2DoRun(response);
    return;
  }
  var hasKeys = false;
  if (fileNames !== undefined && fileNames !== null) {
    if (fileNames.length > 0) {
      hasKeys = true;
    }
  }
  if (!hasKeys) {
    this.flagFoldersWereInitialized = false;
    this.initialize5ResetFolders(response);
    return;
  }
  this.fileNameNodeAddress = fileNames[0];
  fs.readFile(this.fileNameNodeAddress, this.initialize4StoreKey.bind(this, response));
}

NodeKanbanGo.prototype.initialize4StoreKey = function(response, error, data) {
  if (error !== null && error !== undefined) {
    this.notes += `Error reading stored key: ${this.fileNameNodeAddress}. ${error}<br>\n`;
    this.flagFoldersWereInitialized = false;
    this.initialize5ResetFolders(response);
    return;
  }
  this.ethereumAddress = data;
  getInitializer().numberOfNodesWithFinishedInitialization ++;
  getInitializer().runNodes2DoRun(response);
}

NodeKanbanGo.prototype.initialize5ResetFolders = function(response) {
  rimraf(this.dataDir, this.initialize6CreateFolders.bind(this, response));
}

NodeKanbanGo.prototype.initialize6CreateFolders = function(response, error) {
  if (error !== null && error !== undefined) {
    this.notes += `Error while deleting folder: ${this.dataDir}. ${error}<br>\n`;
  } else {
    this.notes += `Deleted folder: ${this.dataDir}.`;
  }
  var initializer = getInitializer(); 
  var theOptions = {
    cwd: initializer.paths.gethPath,
    env: process.env
  };
  this.flagFoldersWereInitialized = false;
  var theArguments = [
    "--datadir",
    this.dataDir,
    "--networkid",
    this.idNetwork,
    "account",
    "new",
    "--password",
    initializer.paths.passwordEmptyFile
  ];
  initializer.runShell(initializer.paths.geth, theArguments, theOptions, this.id, this.initialize2ReadKeyStore.bind(this, response));
}

NodeKanbanGo.prototype.run4InitializeNode = function(response) {
  var initializer = getInitializer();
  var theOptions = {
    cwd: initializer.paths.gethPath,
    env: process.env
  };
  this.flagFoldersWereInitialized = false;
  var theArguments = [
    "--datadir",
    this.dataDir,
    "--networkid",
    this.idNetwork,
    "init",
    initializer.paths.pbftConfigurationFileName
  ];
  initializer.runShell(initializer.paths.geth, theArguments, theOptions, this.id, this.run5GenerateNodeKey.bind(this, response));
}

NodeKanbanGo.prototype.run = function(response) {
  if (!this.flagFoldersInitialized) {
    throw `Fatal error: attempt to run node: ${this.id} without initializing folders first. `;
  }
  var initializer = getInitializer();
  var theOptions = {
    cwd: initializer.paths.gethPath,
    env: process.env
  };
  var theArguments = [
    "--datadir",
    this.dataDir,
    "--networkid",
    this.idNetwork,
    "--port",
    this.port.toString(),
    "--rpcport",
    this.RPCPort.toString()
  ];
  initializer.runShell(initializer.paths.geth, theArguments, theOptions, this.id);
  initializer.numberOfStartedNodes ++;
  initializer.runNodesFinish(response);
}

/**
 * All-in one initilizer for geth nodes.
 * @class
 */
function KanbanGoInitializer() {
  console.log(" DEBUG: firing up kanbango init");
  this.numberRequestsRunning = 0;
  this.maxRequestsRunning = 4;
  this.handlers = {
    runNodes: {

    }
  };
  this.colors = ["yellow", "green", "blue", "cyan", "magenta"];
  this.paths = {
    geth: null,
    gethPath: null,
    dataDir: null,
    nodesDir: null,
    passwordEmptyFile: null,
    pbftConfigSeed: null,
    pbftConfig: null
  };
  /** @type {NodeKanbanGo[]} */
  this.nodes = [];
  this.numberOfStartedNodes = 0;
  this.numberOfNodesWithFinishedInitialization = 0;
  this.pbftConfiguration = null;
  this.computePaths();
  console.log(" DEBUG: exiting constructor of kanban initializer.");
}

KanbanGoInitializer.prototype.handleRequest =  function(request, response) {
  //console.log("DEBUG: kanban go init: " + JSON.stringify(this));
  if (request.method === "GET") {
    return this.handleRPCGET(request, response);
  }
  response.writeHead(400);
  return response.end(`Method not implemented: ${request.method} not implemented. `);
}

KanbanGoInitializer.prototype.handleRPCGET = function(request, response) {
  var parsedURL = null;
  try {
    parsedURL = url.parse(request.url);
  } catch (e) {
    response.writeHead(400);
    return response.end(`In handlers_kanban_go: bad RPC request: ${e}.`);
  }
  return this.handleRPCURLEncodedInput(request, response, parsedURL.query);
}

KanbanGoInitializer.prototype.handleRPCURLEncodedInput = function(request, response, messageBodyURLed) {
  var query = null;
  var queryCommand = null;
  try {
    query = queryString.parse(messageBodyURLed);
    queryCommand = JSON.parse(query.command);
  } catch (e) {
    response.writeHead(400);
    return response.end(`Bad RPC input. ${e}`);
  }
  return this.handleRPCArguments(request, response, queryCommand);
}

KanbanGoInitializer.prototype.computePaths = function() {
  console.log("DEBUG: Got to compute paths. ");
  if (this.paths.geth !== null) {
    callback();
    return;
  }
  //console.log("DEBUG: Computing paths.");
  var staringPath = `${pathnames.path.base}/go/src/github.com/blockchaingate/kanban-go/build/bin/`;
  staringPath = path.normalize(staringPath);
  var currentPath = staringPath;
  var maxNumRuns = 100;
  var numRuns = 0;
  var kanbanDataDirName = global.kanban.configuration.kanbanGO.dataDirName;
  while (currentPath !== "/") {
    numRuns ++;
    if (numRuns > maxNumRuns) {
      break;
    }
    if (this.paths.geth === null) {
      var currentPathGeth = currentPath + "geth";
      if (fs.existsSync(currentPathGeth)) {
        this.paths.geth = currentPathGeth;
        this.paths.gethPath = currentPath;
      }
    }
    if (this.paths.dataDir === null) {
      var currentDataDir = currentPath + kanbanDataDirName;
      if (fs.existsSync(currentDataDir)) {
        this.paths.dataDir = currentDataDir;
      }
    }
    if (this.paths.geth !== null && this.paths.dataDir !== null) {
      break;
    }
    currentPath = path.normalize(currentPath + "../");
  }
  if (this.paths.geth === null) {
    console.log(`Could not find geth executable. Searched directories along: ${staringPath}`.red);
    throw(`Could not find geth executable.`);
  } else {
    console.log(`Found geth executable:`.green + `${this.paths.geth}`.blue);
  }
  if (this.paths.dataDir === null) {
    console.log(`Could not find data directory ${kanbanDataDirName}. Searched directories along: ${staringPath}`.red);
    throw(`Could not find data directory.`);
  } else {
    console.log(`Found data directory: `.green + `${this.paths.dataDir}`.blue);
  }
  this.paths.pbftConfig = `${this.paths.dataDir}/pbft.json`;
  this.paths.pbftConfigSeed = `${this.paths.dataDir}/pbft_seed.json`;
  this.paths.passwordEmptyFile = `${this.paths.dataDir}/password_empty.txt`;
  this.paths.nodesDir = `${this.paths.dataDir}/nodes`;
  console.log("DEBUG: pbft config seed: " + this.paths.pbftConfigSeed);
  fs.readFile(this.paths.pbftConfigSeed, (err, data)=> {
    this.pbftConfiguration = JSON.parse(data);
  });
}

KanbanGoInitializer.prototype.runNodesFinish = function(response) {
  //if (this.numberOfStartedNodes < this.nodes.length) {
  //  return;
  //}
  var result = {};
  result.result = `Spawned ${this.nodes.length} nodes.`;
  var nodeNotes = [];
  for (var counterNodes = 0; counterNodes < this.nodes.length; counterNodes ++) {
    if (this.nodes[counterNodes].notes !== "") {
      nodeNotes[counterNodes] = this.nodes[counterNodes].notes;
    }
  }
  if (nodeNotes.length > 0) {
    result.notes = nodeNotes;
  }
  response.writeHead(200);
  response.end(JSON.stringify(result));
}

KanbanGoInitializer.prototype.runNodes = function(response, queryCommand) {
  console.log(`DEBUG: Got to here. This: ` + this);
  console.log(`DEBUG: Got to here pbft paths: ${this.paths.pbftConfigurationFileName}`.cyan);
  console.log(`DEBUG: run nodes. initializer.paths: ${this.paths}` );
  var candidateNumberOfNodes = Number(queryCommand.numberOfNodes);
  var maxNumberOfNodes = 100;
  if (candidateNumberOfNodes > maxNumberOfNodes || candidateNumberOfNodes < 1) {
    response.writeHead(400);
    response.end(`Bad number of nodes: ${candidateNumberOfNodes}. I expected a number between 1 and ${maxNumberOfNodes}.`);
    return;
  }
  if (this.nodes.length > 0) {
    this.numberRequestsRunning --;
    response.writeHead(200);
    response.end(`${this.nodes.length} nodes already spawned. Restart the server if you want a new number of nodes. `);
    return;
  }
  for (var counterNode = 0; counterNode < candidateNumberOfNodes; counterNode ++) {
    this.nodes.push(new NodeKanbanGo(counterNode));
  }
  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    this.nodes[counterNode].initializeFoldersAndKeys(response);
  }
}

KanbanGoInitializer.prototype.runNodes2DoRun = function(response) {
  if (this.numberOfNodesWithFinishedInitialization < this.nodes.length) {
    return;
  }
  this.runNodesFinish(response);
  return;
  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    if (!this.nodes[i].flagFoldersInitialized) {
      var result = {};
      result.error = `Failed to initilize folders for node: ${counterNode}`;
      result.notes = this.nodes[i].notes;
    }
  }
  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    this.nodes[counterNode].run();
  }

}

KanbanGoInitializer.prototype.runShell = function(command, theArguments, theOptions, id, callbackOnExit) {
  //console.log(`DEBUG: Running ` +`${command}`.green);
  //console.log(`DEBUG: Arguments: ` + `[${theArguments.join(", ")}]`.blue);
  var child = childProcess.spawn(command, theArguments, theOptions);
  var color = this.colors[id % this.colors.length];
  child.stdout.on('data', function(data) {
    console.log(`[shell ${id}] `[color] + data.toString());
  });
  child.stderr.on('data', function(data) {
    console.log(`[shell ${id}] `[color] + data.toString());
  });
  child.on('error', function(data) {
    console.log(`[shell ${id}] `[color] + data.toString());
  });
  child.on('exit', function(code) {
    console.log(`Geth ${id} exited with code: ${code}`.green);
    if (callbackOnExit !== undefined && callbackOnExit !== null) {
      callbackOnExit();
    }
  });
}

KanbanGoInitializer.prototype.handleRPCArguments = function(request, response, queryCommand) {
  //console.log(`DEBUG: this.paths: ${this.paths}.`);
  this.numberRequestsRunning ++;
  if (this.numberRequestsRunning > this.maxRequestsRunning) {
    response.writeHead(500);
    this.numberRequestsRunning --;
    return response.end(`Too many (${this.numberRequestsRunning}) requests running, maximum allowed: ${this.maxRequestsRunning}. `);
  }
  var theCallLabel = queryCommand[pathnames.rpcCall];
  if (!(theCallLabel in kanbanGOInitialization.rpcCalls)) {
    response.writeHead(400);
    this.numberRequestsRunning --;
    return response.end(`KanbanGO initialization call label ${theCallLabel} not found. `);    
  }
  if (!(theCallLabel in this.handlers)) {
    response.writeHead(200);
    return response.end(`{"error": "No handler named ${theCallLabel}"} found. `);
  }
  var currentHandler = this.handlers[theCallLabel];
  var currentFunction = currentHandler.handler;
  if (currentFunction === undefined || currentFunction === null) {
    currentFunction = this[theCallLabel];
  }
  if (currentFunction === undefined || currentFunction === null || (typeof currentFunction !== "function")) {
    response.writeHead(500);
    return response.end(`{"error": "Server error: handler ${theCallLabel}"} declared but no implementation found. `);
  }
  try {
    console.log(`DEBUG: got to here: ${this.paths}.`);
    return (currentFunction.bind(this))(response, queryCommand);
  } catch (e) {
    response.writeHead(500);
    return response.end(`Server error: ${e}`);
  }
}

module.exports = {
  KanbanGoInitializer,
  getInitializer
}