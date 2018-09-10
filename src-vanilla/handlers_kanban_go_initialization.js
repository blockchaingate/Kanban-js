"use strict";
const url  = require('url');
const queryString = require('querystring');
const kanbanGOInitialization = require('./resources_kanban_go_initialization');
const pathnames = require('./pathnames');
const childProcess = require("child_process");
const fs = require('fs');
const path = require('path');
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
  this.dataDir = `${getInitializer().paths.dataDir}/node${this.id}`;
  this.lockFileName = `${this.dataDir}/geth/LOCK`;
  this.keyStoreFolder = `${this.dataDir}/keystore`;
  this.port = this.id + 40107;
  this.RPCPort = this.id + 4007;
  this.numberAttemptsToSelectAddress = 0;
  this.maximumAttemptsToSelectAddress = 4;
}

NodeKanbanGo.prototype.run = function(response) {
  console.log("DEBUG: run: pbft.json: " + getInitializer().pbftConfigurationFileName);
  fs.unlink(this.lockFileName, this.run2GetKeyStoreList.bind(this, response));
}

NodeKanbanGo.prototype.run2GetKeyStoreList = function(response, error) {
  console.log("DEBUG: run2: pbft.json: " + getInitializer().pbftConfigurationFileName);
  if (error !== null && error !== undefined) {
    this.notes += error;
    console.log(`Error while running geth node ${this.id}. ${error} `.red);
  }
  fs.readdir(this.keyStoreFolder, this.run3SelectAddress.bind(this, response));
}

NodeKanbanGo.prototype.run3SelectAddress = function(response, error, fileNames) {
  if (error !== null && error !== undefined) {
    this.notes += error;
    console.log(`Error while selecting address from keystore with id: ${this.id}. ${error} `.red);
  }
  this.numberAttemptsToSelectAddress ++;
  if (this.numberAttemptsToSelectAddress > this.maximumAttemptsToSelectAddress) {
    getInitializer().runNodesFinish(response);
    return;
  }
  console.log("DEBUG: this: " + this);
  console.log("DEBUG: response: " + response);
  console.log("DEBUG: File names: " + fileNames);
  var hasKeys = false;
  if (fileNames !== undefined && fileNames !== null) {
    if (fileNames.length > 0) {
      hasKeys = true;
    }
  }
  if (!hasKeys) {
    this.run4InitializeNode(response);
    return;
  }
  this.fileNameNodeAddress = fileNames[0];
  fs.readFile(this.fileNameNodeAddress, this.run6StoreKey.bind(this, response));
}

NodeKanbanGo.prototype.run4InitializeNode = function(response) {
  var initializer = getInitializer();
  var theOptions = {
    cwd: initializer.paths.gethPath,
    env: process.env
  };
  console.log("DEBUG: initializer: " + initializer);
  console.log("DEBUG: about to initialize: " + initializer.pbftConfigurationFileName);
  var theArguments = [
    "--datadir",
    this.dataDir,
    "--networkid",
    this.idNetwork,
    "init",
    initializer.pbftConfigurationFileName
  ];
  initializer.runShell(initializer.paths.geth, theArguments, theOptions, this.id, this.run5GenerateNodeKey.bind(this, response));
}

NodeKanbanGo.prototype.run5GenerateNodeKey = function(response) {
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
    "account",
    "new",
    "--password",
    initializer.paths.passwordEmptyFile
  ];
  initializer.runShell(initializer.paths.geth, theArguments, theOptions, this.id, this.run2GetKeyStoreList.bind(this, response));
}

NodeKanbanGo.prototype.run6StoreKey = function(response, error, data) {
  if (error !== null && error !== undefined) {
    this.notes += error;
    console.log(`Failed to read stored address from file name: ${this.fileNameNodeAddress}`.red);
  }
  this.ethereumAddress = data;
  this.run7StartNode(response);
}

NodeKanbanGo.prototype.run7StartNode = function(response) {
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
    passwordEmptyFile: null,
  };
  this.nodes = [];
  this.numberOfStartedNodes = 0;
  this.pbftConfiguration = null;
  this.pbftConfigurationFileName = null;
  console.log(`DEBUG: this.pbftConfigurationFileName: ${this.pbftConfigurationFileName}`.red);
  if (this.pbftConfigurationFileName !== undefined && this.pbftConfigurationFileName !== null) {
    throw `Unexpected pbft config file name: ${this.pbftConfigurationFileName}`;
  }
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
  this.pbftConfigurationFileName = `${this.paths.dataDir}/pbft.json`;
  console.log("DEBUG: pbft configuration file name: " + this.pbftConfigurationFileName);
  fs.readFile(this.pbftConfigurationFileName, (err, data)=> {
    this.pbftConfiguration = JSON.parse(data);
  });
}

KanbanGoInitializer.prototype.runNodesFinish = function(response) {
  if (this.numberOfStartedNodes < this.nodes.length) {
    return;
  }
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
  console.log(`DEBUG: Got to here pbft paths: ${this.pbftConfigurationFileName}`.cyan);
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
    this.nodes[counterNode].run(response);
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