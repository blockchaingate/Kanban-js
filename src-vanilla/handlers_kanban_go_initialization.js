"use strict";
const url  = require('url');
const queryString = require('querystring');
const kanbanGOInitialization = require('./resources_kanban_go_initialization');
const pathnames = require('./pathnames');
const childProcess = require("child_process");
const fs = require('fs');
const path = require('path');
const configuration = require('./configuration').configuration;


function KanbanGoInitializerBackend() {
  this.handlers = {
    createNodes: {

    }
  };
  this.paths = {
    geth: null,
    dataDir: null
  };
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

var numberRequestsRunning = 0;
var maxRequestsRunning = 4;

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

KanbanGoInitializerBackend.prototype.createNodes = function(response, queryCommand) {
}

KanbanGoInitializerBackend.prototype.handleRPCArguments = function(request, response, queryCommand) {
  numberRequestsRunning ++;
  if (numberRequestsRunning > maxRequestsRunning) {
    response.writeHead(500);
    numberRequestsRunning --;
    return response.end(`Too many (${numberRequestsRunning}) requests running, maximum allowed: ${maxRequestsRunning}. `);
  }
  var theCallLabel = queryCommand[pathnames.rpcCall];
  if (!(theCallLabel in kanbanGOInitialization.rpcCalls)) {
    response.writeHead(400);
    numberRequestsRunning --;
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
  return currentFunction.bind(this)(response, queryCommand);
/*  var theCommand = `${theCall.command}`;
  const defaultOptions = {
    cwd: undefined,
    env: process.env
  };
  console.log(`Executing fabcoin initialization command: ${theCommand}.`.blue);
  console.log(`Arguments: [${theArguments.join(", ")}].`.green);
  if (theCall.path !== undefined && theCall.path !== null && theCall.path !== "") {
    if (theCall.path in pathnames.pathsComputedAtRunTime) {
      console.log(`Path substitution: ${theCall.path} is replaced by: ${pathnames.pathsComputedAtRunTime[theCall.path]}`);
      theCall.path = pathnames.pathsComputedAtRunTime[theCall.path];
    }
    defaultOptions.cwd = theCall.path;
    console.log(`Command will start from: ${defaultOptions.cwd}`.yellow);
  }
  var finalData = "";
  var sentResponse = false;
  try {
    var child = childProcess.spawn(theCommand, theArguments, defaultOptions);
    child.stdout.on('data', function(data) {
      console.log(data.toString());
      finalData += data.toString();
    });
    child.stderr.on('data', function(data) {
      console.log(data.toString());
      finalData += data.toString();
    });
    child.on('error', function(data) {
      console.log(data.toString());
      numberRequestsRunning --;
      if (!sentResponse) {
        sentResponse = true;
        response.writeHead(200);
        response.end(`{"error": "${data}", "data": "${finalData}"}`);
      }
    });
    child.on('exit', function(code) {
      console.log(`Fabcoin initialization exited with code: ${code}`.green);
      numberRequestsRunning --;
      if (code === 0) {
        response.writeHead(200);
        if (finalData === "") {
          finalData = `Nothing to output: most likely your command was executed correctly.`;
        }
        response.end(finalData);
      } else {
        if (!sentResponse) {
          sentResponse = true;
          response.writeHead(200);
          response.end(`{"error": "${finalData}"}`);
        }
      }
    });
  } catch (e) {
    response.writeHead(500);
    numberRequestsRunning --;
    response.end(`Eror: ${e}. `);
    console.log(`Error: ${e}`);
  }
  return;*/
}

var kanbanGoInitializerBackend = new KanbanGoInitializerBackend();

module.exports = {
  kanbanGoInitializerBackend
}