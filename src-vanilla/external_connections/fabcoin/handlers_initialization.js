"use strict";
const fabcoinInitializationSpec = require('./initialization');
const childProcess = require("child_process");

/**
 * Returns a global FabcoinNode object
 * @returns {FabcoinNode}
 */
function getFabcoinNode() {
  return global.fabcoinNode;
}

function FabcoinNode() {
  this.paths = {
    executablePath: global.kanban.configuration.fabcoin.executablePath,
    dataDir: global.kanban.configuration.fabcoin.dataDir
  };
  this.handlers = {};
  /** @type {boolean} */
  this.started = false;
}

FabcoinNode.prototype.handleRequest =  function(request, response) {
  var parsedURL = null;
  try {
    parsedURL = url.parse(request.url);
  } catch (e) {
    response.writeHead(400);
    return response.end(`In handlers_kanban_go: bad RPC request: ${e}.`);
  }
  return this.handleRPCURLEncodedInput(request, response, parsedURL.query);
}

FabcoinNode.prototype.handleRPCURLEncodedInput = function(request, response, messageBodyURLed) {
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

FabcoinNode.prototype.getArgumentsFromSpec = function(spec, queryCommand, /**@type {Array}*/output, outputErrors) {
  for (var counterParameter = 0; counterParameter < spec.parameters.length; counterParameter ++) {
    var desiredLabel = spec.parameters[counterParameter]; 
    if (queryCommand[desiredLabel] !== undefined && queryCommand[desiredLabel] !== null) {
      output.push(queryCommand[desiredLabel]);
    }
  }
  return true;
}

FabcoinNode.prototype.handleRPCArguments = function(request, response, queryCommand) {
  var theCallLabel = queryCommand[fabcoinInitializationSpec.urlStrings.rpcCallLabel];
  if (!(theCallLabel in fabcoinInitializationSpec.rpcCalls)) {
    response.writeHead(400);
    return response.end(`Fabcoin initialization call ${theCallLabel} not found. `);    
  }
  if (!(theCallLabel in this.handlers) && !(theCallLabel in this)) {
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
  var theArguments = [];
  var errors = [];
  if (! this.getArgumentsFromSpec(fabcoinInitializationSpec[theCallLabel], queryCommand, theArguments, errors)) {
    response.writeHead(400);
    response.end(`Error obtaining arguments. ${errors[0]}`);
    return;
  }
  try {
    return (currentFunction.bind(this))(response, theArguments);
  } catch (e) {
    response.writeHead(500);
    return response.end(`Server error: ${e}`);
  }
}

FabcoinNode.prototype.runNode = function (response, theArguments) {
  if (this.started) {
    response.writeHead(200);
    response.end("Node already started. ");
    return;
  }
  this.started = true;
  var options = {
    cwd: this.paths.executablePath,
    env: process.env
  };
  this.runShell(this.paths.executablePath, theArguments, options, null);
  response.writeHead(200);
  response.end("Fabcoind started. ");
  return;
}

FabcoinNode.prototype.runShell = function(command, theArguments, options, callbackOnExit) {
  console.log(`About to execute: ${command}`.yellow);
  console.log(`Arguments: ${theArguments}`.green);
  var child = childProcess.spawn(command, theArguments, options);
  var shellId = "[fabcoin]".red;
  child.stdout.on('data', function(data) {
    console.log(shellId + data.toString());
  });
  child.stderr.on('data', function(data) {
    console.log(shellId + data.toString());
  });
  child.on('error', function(data) {
    console.log(shellId + data.toString());
  });
  child.on('exit', function(code) {
    console.log(`Geth ${id} exited with code: ${code}`.green);
    if (callbackOnExit !== undefined && callbackOnExit !== null) {
      callbackOnExit();
    }
  });
  return child;
}





module.exports = {
  getFabcoinNode,
  FabcoinNode
}