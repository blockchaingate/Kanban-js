"use strict";
require('colors');
const fabcoinInitializationSpec = require('./initialization');
const fabcoinRPC = require('./rpc');
const childProcess = require("child_process");
const path = require('path');
var OutputStream = require('../../output_stream').OutputStream;
const crypto = require('crypto');
const cryptoKanban = require('../../crypto/encodings');
//const kanbanGO = require('../kanbango/handlers_initialization');

/**
 * Returns a global FabcoinNode object
 * @returns {FabcoinNode}
 */
function getFabcoinNode() {
  return global.fabcoinNode;
}

function FabcoinNode() {
  var executableName = global.kanban.configuration.configuration.fabcoin.executableFileName;
  var executablePath = path.dirname(executableName);
  this.paths = {
    executablePath: executablePath,
    executableFileName: executableName,
    dataDir: global.kanban.configuration.configuration.fabcoin.dataDir
  };
  this.configuration = {
    RPCPort: 38667,
    /**@type {boolean} */
    network: "",
    /**@type {boolean} */
    flagPrintingToConsole: false,
    /**@type {string} */
    RPCPassword: (new cryptoKanban.Encoding).toHex(crypto.randomBytes(50)),
    RPCUser: 'nodejs',
  };
//  console.log("WARNING: OVER-RIDING non-randomly generated password, please fix!");
//  this.configuration.RPCPassword = "password";
//  this.configuration.RPCUser = "nodejs";


  console.log(`Node.js' randomly generated password for fabcoin RPC: `+ `${this.configuration.RPCPassword}`.red);
  /**@type {string[]} */
  this.argumentList = [];
  this.handlers = {};
  /** @type {boolean} */
  this.flagStarted = false;
  /** @type {boolean} */
  this.flagStartWasEverAttempted = false;
  /**@type {{command: OutputStream, fabcoind: OutputStream} */
  this.outputStreams = {
    command: new OutputStream(),
    fabcoind: new OutputStream(),
  };
  this.initStreams();
}

FabcoinNode.prototype.initStreams =  function() {
  this.outputStreams.command.idConsole = "[fabcoind command] ";
  this.outputStreams.command.colorIdConsole = "red";
  this.outputStreams.fabcoind.idConsole = "[fabcoind] ";
  this.outputStreams.fabcoind.colorIdConsole = "blue";
}

FabcoinNode.prototype.handleQuery = function(response, query) {
  var queryCommand = null;
  try {
    queryCommand = JSON.parse(query.command);
  } catch (e) {
    response.writeHead(400);
    return response.end(`Bad fabcoin initialization input. ${e}`);
  }
  return this.handleRPCArguments(response, queryCommand);
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

FabcoinNode.prototype.handleRPCArguments = function(response, queryCommand) {
  var theCallLabel = queryCommand[fabcoinRPC.urlStrings.rpcCallLabel];
  if (!(theCallLabel in fabcoinInitializationSpec.rpcCalls)) {
    response.writeHead(400);
    return response.end(`Fabcoin initialization call ${theCallLabel} not found. `);    
  }
  if (!(theCallLabel in this.handlers) && !(theCallLabel in this)) {
    response.writeHead(200);
    return response.end(`{"error": "No FAB handler named ${theCallLabel} found."}`);
  }
  var currentHandler = this.handlers[theCallLabel];
  var currentFunction = null;
  if (currentHandler !== undefined && currentHandler !== null) {
    currentFunction = currentHandler.handler;
  }
  if (currentFunction === undefined || currentFunction === null) {
    currentFunction = this[theCallLabel];
  }
  if (currentFunction === undefined || currentFunction === null || (typeof currentFunction !== "function")) {
    response.writeHead(500);
    return response.end(`{"error": "Server error: handler ${theCallLabel} declared but no implementation found."}`);
  }
  /**@type {string[]} */
  var theArguments = [];
  var errors = [];
  if (!this.getArgumentsFromSpec(fabcoinInitializationSpec.rpcCalls[theCallLabel], queryCommand, theArguments, errors)) {
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

FabcoinNode.prototype.showLogFabcoind = function(response, theArguments) {
  response.writeHead(200);
  response.end(this.outputStreams.fabcoind.toString());
}

FabcoinNode.prototype.prepareArgumentList = function () {
  this.argumentList = [];

  this.argumentList.push(`-rpcpassword=${this.configuration.RPCPassword}`);
  //var initializer = global.kanban.kanbanGOInitializer;
  //console.log(`Initializer: ${JSON.stringify(initializer.paths)}`);
  //var outputPath = `${initializer.paths.gethProjectBase}/fabcoind_rpc_password`; 
  //console.log(`DEBUG: About to write ${this.configuration.RPCPassword} to file: ${outputPath}`);
  //fs.writeFile(outputPath, this.configuration.RPCPassword, (err)=>{});
  this.argumentList.push(`-rpcuser=${this.configuration.RPCUser}`);
  this.argumentList.push(`-datadir=${this.paths.dataDir}`);
  this.argumentList.push(`-txindex=1`);
  this.argumentList.push(`-logevents`);
  if (this.configuration.network !== "") {
    this.argumentList.push(this.configuration.network);
  }
}

FabcoinNode.prototype.runFabcoind = function (response, /**@type {string[]} */ argumentsNonSplit) {
  if (this.flagStarted) {
    var result = {}
    result.error = "Node already started, use killaAllFabcoind to reset. ";
    response.writeHead(200);
    response.end(JSON.stringify(result));
    return;
  }
  var fabcoindArguments = [];
  this.flagPrintingToConsole = false;
  for (var i = 0; i < argumentsNonSplit.length; i ++) {
    var currentArguments = argumentsNonSplit[i].split(' ');
    for (var j = 0; j < currentArguments.length; j ++) {
      var current = currentArguments[j].trim(); 
      if (current === "") {
        continue;
      }
      switch(current) {
        case "-printtoconsole":
          this.configuration.flagPrintingToConsole = true;
          break;
        case "-regtest":
        case "--regtest":
          this.configuration.network = "-regtest";
          break;
        default:
          fabcoindArguments.push(current);
          break;
      }
    }
  }
  this.flagStarted = true;
  this.flagStartWasEverAttempted = true;
  var options = {
    cwd: this.paths.executablePath,
    env: process.env
  };
  this.prepareArgumentList();
  for (var i = 0; i < this.argumentList.length; i ++) {
    fabcoindArguments.push(this.argumentList[i]);
  }
  this.runShell(this.paths.executableFileName, fabcoindArguments, options, null, this.outputStreams.fabcoind);
  response.writeHead(200);
  response.end(JSON.stringify(this.outputStreams.fabcoind.toArray()));
  return;
}

FabcoinNode.prototype.killAllFabcoindCallback = function (response) {
  this.flagStarted = false;
  response.writeHead(200);
  response.end(this.outputStreams.command.toStringWithFlush());
}

FabcoinNode.prototype.appendToOutputStream = function(
  data, 
  /**@type {OutputStream} */ 
  stream
) {
  if (! (stream instanceof OutputStream)) {
    console.log(`[non-logged command] ${data}`);
    return;
  }
  stream.append(data.toString());
}

FabcoinNode.prototype.killAllFabcoind = function (response, theArguments) {
  this.runShell("killall", ["fabcoind"], null, this.killAllFabcoindCallback.bind(this, response), this.outputStreams.command);
}

FabcoinNode.prototype.runShell = function(command, theArguments, options, callbackOnExit, /**@type {OutputStream} */ output) {
  if (output !== null && output !== undefined) {
    output.append(`Command: ${command}`);  
    if (options !== null && options !== undefined) {
      output.append(`Executable path: ${options.cwd}`);
    }
    output.append(`Arguments: ${theArguments}`);
  }
  var child = null;
  if (options !== null && options !== undefined) {
    child = childProcess.spawn(command, theArguments, options);
  } else {
    child = childProcess.spawn(command, theArguments);
  }
  var callerNode = this;
  child.stdout.on('data', function(data) {
    callerNode.appendToOutputStream(data.toString(), output);
  });
  child.stderr.on('data', function(data) {
    callerNode.appendToOutputStream(data.toString(), output);
  });
  child.on('error', function(data) {
    callerNode.appendToOutputStream(data.toString(), output);
  });
  child.on('exit', function(code) {
    callerNode.appendToOutputStream(`Exited with code: ${code}`, output);
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