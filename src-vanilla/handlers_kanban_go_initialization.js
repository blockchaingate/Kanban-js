"use strict";
const url  = require('url');
const queryString = require('querystring');
const kanbanGOInitialization = require('./resources_kanban_go_initialization');
const pathnames = require('./pathnames');
const childProcess = require("child_process");
const fs = require('fs');
const path = require('path');
const configuration = require('./configuration').configuration;


function NodeKanbanGo(inputId) {
  this.id = inputId;
  this.notes = "";
}

NodeKanbanGo.prototype.runNodeFromNodeNumber = function(response) {
  var lockFile = `${kanbanGoInitializerBackend.paths.dataDir}/node${this.id}/geth/LOCK`;
  fs.unlink(lockFile, this.runNodeFromNodeNumberPartTwo.bind(this, response));
}

NodeKanbanGo.prototype.runNodeFromNodeNumberPartTwo = function(response, error) {
  if (error !== null && error !== undefined) {
    this.notes += error;
    console.log(`Error while running geth node ${this.id}. ${error} `.red);
  }
  var theOptions = {
    cwd: kanbanGoInitializerBackend.paths.gethPath,
    env: process.env
  };
  var theDir = `${kanbanGoInitializerBackend.paths.dataDir}/node${this.id}`;
  var thePort = this.id + 40107;
  var theRPCPort = this.id + 4007;
  var theArguments = [
    "--datadir",
    theDir,
    "--networkid",
    "211",
    "--port",
    thePort.toString(),
    "--rpcport",
    theRPCPort.toString()
  ];
  var command = kanbanGoInitializerBackend.paths.geth;
  kanbanGoInitializerBackend.runShell(command, theArguments, theOptions, this.id);
  kanbanGoInitializerBackend.numberOfStartedNodes ++;
  kanbanGoInitializerBackend.runNodesFinish(response);
}

function KanbanGoInitializerBackend() {
  this.numberRequestsRunning = 0;
  this.maxRequestsRunning = 4;
  this.handlers = {
    runNodes: {

    }
  };
  this.paths = {
    geth: null,
    gethPath: null,
    dataDir: null
  };
  this.nodes = [];
  this.numberOfStartedNodes = 0;
  this.computePaths();
}

KanbanGoInitializerBackend.prototype.handleRequest =  function(request, response) {
  if (request.method === "GET") {
    return this.handleRPCGET(request, response);
  }
  response.writeHead(400);
  return response.end(`Method not implemented: ${request.method} not implemented. `);
}

KanbanGoInitializerBackend.prototype.handleRPCGET = function(request, response) {
  var parsedURL = null;
  try {
    parsedURL = url.parse(request.url);
  } catch (e) {
    response.writeHead(400);
    return response.end(`In handlers_kanban_go: bad RPC request: ${e}.`);
  }
  return this.handleRPCURLEncodedInput(request, response, parsedURL.query);
}

KanbanGoInitializerBackend.prototype.handleRPCURLEncodedInput = function(request, response, messageBodyURLed) {
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

KanbanGoInitializerBackend.prototype.computePaths = function() {
  if (this.paths.geth !== null) {
    callback();
    return;
  }
  //console.log("DEBUG: Computing paths.");
  var currentPath = pathnames.path.base + "/go/src/github.com/blockchaingate/kanban-go/build/bin/";
  currentPath = path.normalize(currentPath);
  var maxNumRuns = 100;
  var numRuns = 0;
  var kanbanDataDirName = configuration.kanbanGO.dataDirName;
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
    console.log("Could not find geth executable. Expected location: ./go/src/github.com/blockchaingate/kanban-go/build/bin/geth".red);
    throw(`Could not find geth executable.`);
  } else {
    console.log(`Found geth executable:`.green + `${this.paths.geth}`.blue);
  }
  if (this.paths.dataDir === null) {
    console.log("Could not find data directory.".red);
    throw(`Could not find data directory.`);
  } else {
    console.log(`Found data directory: `.green + `${this.paths.dataDir}`.blue);
  }
}

KanbanGoInitializerBackend.prototype.runNodesFinish = function(response) {
  if (this.numberOfStartedNodes < this.nodes.length) {
    return;
  }
  var result = {};
  result.result = `Spawned ${this.nodes.length} nodes.`
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

KanbanGoInitializerBackend.prototype.runNodes = function(response, queryCommand) {
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
    response.end(`${this.nodes.length} nodes already spanned. Restart the server if you want a new number of nodes. `);
    return;
  }
  for (var counterNode = 0; counterNode < candidateNumberOfNodes; counterNode ++) {
    this.nodes.push( new NodeKanbanGo(counterNode));
  }
  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    this.nodes[counterNode].runNodeFromNodeNumber(response);
  }
}

KanbanGoInitializerBackend.prototype.runShell = function(command, theArguments, theOptions, id) {
  //console.log(`DEBUG: Running ` +`${command}`.green);
  //console.log(`DEBUG: Arguments: ` + `[${theArguments.join(", ")}]`.blue);
  var child = childProcess.spawn(command, theArguments, theOptions);
  child.stdout.on('data', function(data) {
    console.log(`[shell ${id}]` + data.toString());
  });
  child.stderr.on('data', function(data) {
    console.log(`[shell ${id}] ` + data.toString());
  });
  child.on('error', function(data) {
    console.log(`[shell ${id}] ` + data.toString());
  });
  child.on('exit', function(code) {
    console.log(`Geth ${id} exited with code: ${code}`.green);
  });
}

KanbanGoInitializerBackend.prototype.handleRPCArguments = function(request, response, queryCommand) {
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
    return currentFunction.bind(this)(response, queryCommand);
  } catch (e) {
    response.writeHead(500);
    return response.end(`Server error: ${e}`);
  }
}

var kanbanGoInitializerBackend = new KanbanGoInitializerBackend();

module.exports = {
  kanbanGoInitializerBackend
}