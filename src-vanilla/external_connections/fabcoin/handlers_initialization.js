"use strict";
require('colors');
const fabcoinInitializationSpec = require('./initialization');
const fabcoinRPC = require('./rpc');
const childProcess = require("child_process");
const path = require('path');
var OutputStream = require('../../output_stream').OutputStream;
const crypto = require('crypto');
const cryptoKanban = require('../../crypto/encodings');
var demo = require('./handlers_smart_contract').demo;
const responseWrapperLib = require('../../response_wrapper');
const ResponseWrapper = responseWrapperLib.ResponseWrapper;
const memoryWatch = require('../../memory_watch');

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

FabcoinNode.prototype.getArgumentsFromSpec = function(
  spec, 
  queryCommand, 
  /**@type {Array}*/ 
  output, 
  outputErrors,
) {
  for (var counterParameter = 0; counterParameter < spec.parameters.length; counterParameter ++) {
    var desiredLabel = spec.parameters[counterParameter]; 
    if (queryCommand[desiredLabel] !== undefined && queryCommand[desiredLabel] !== null) {
      output.push(queryCommand[desiredLabel]);
    }
  }
  var mandatoryArguments = spec.mandatoryModifiableArguments;
  if (mandatoryArguments !== undefined && mandatoryArguments !== null) {
    for (var label in mandatoryArguments) {
      if (!(label in queryCommand)) {
        outputErrors.push(`Mandatory variable ${label} missing. `);
        return false;
      }
    }
  }
  return true;
}

FabcoinNode.prototype.handleRPCArguments = function(response, queryCommand) {
  if (response === undefined) {
    throw(`Undefined response not allowed at this point of code. `);
  }
  var theCallLabel = queryCommand[fabcoinRPC.urlStrings.rpcCallLabel];
  var theRPCSpec = null;
  if (theCallLabel in fabcoinInitializationSpec.rpcCalls) {
    theRPCSpec = fabcoinInitializationSpec.rpcCalls;
  }
  if (theCallLabel in fabcoinInitializationSpec.demoRPCCalls) {
    theRPCSpec = fabcoinInitializationSpec.demoRPCCalls;
  }
  if (theRPCSpec === null) {
    response.writeHead(400);
    var result = {
      error: `Fabcoin initialization call ${theCallLabel} not found. `
    };
    return response.end(JSON.stringify(result));    
  }
  var currentFunction = null;
  var currentFunctionThisObject = this;
  if (currentFunction === undefined || currentFunction === null) {
    currentFunction = this[theCallLabel];
  }
  if (currentFunction === undefined || currentFunction === null) {
    currentFunction = demo[theCallLabel];
    currentFunctionThisObject = demo;
  }
  if (currentFunction === null || currentFunction === undefined || (typeof currentFunction !== "function")) {
    response.writeHead(500);
    var result = {
      error: `Function with label ${theCallLabel} was declared but no handler was found.`
    };
    return response.end(JSON.stringify(result));
  }
  /**@type {string[]} */
  var theArguments = [];
  var errors = [];
  if (!this.getArgumentsFromSpec(theRPCSpec[theCallLabel], queryCommand, theArguments, errors)) {
    response.writeHead(400);
    result = {
      error: errors[0]
    };
    response.end(JSON.stringify(result));
    return;
  }
  try {
    return (currentFunction.bind(currentFunctionThisObject))(response, theArguments, queryCommand);
  } catch (e) {
    response.writeHead(500);
    var result = {
      error: `Server error at handleRPCArguments: ${e}. Call label: ${theCallLabel}. `
    };
    return response.end(JSON.stringify(result));
  }
}

FabcoinNode.prototype.getServerInformation = function (
  /**@type {ResponseWrapper} */
  response, 
  theArguments, 
  queryCommand,
) {
  response.writeHead(200);
  var result = {};
  result.memoryUsage = process.memoryUsage();
  result.requests = responseWrapperLib.responseStatsGlobal.toJSON();
  result.leakSuspicions = memoryWatch.memoryWatcher.leakSuspicions;
  result.memoryWatchStatistics = memoryWatch.memoryWatcher.latestStats;
  response.end(JSON.stringify(result));
}

FabcoinNode.prototype.showLogFabcoind = function(response, theArguments) {
  response.writeHead(200);
  response.end(JSON.stringify(this.outputStreams.fabcoind.toArray()));
}

FabcoinNode.prototype.runFabcoind = function (response, argumentsNonSplitUnused, queryCommand) {
  if (this.flagStarted) {
    var result = {
      error: "Node already started, use killaAllFabcoind to reset. ",
    }
    response.writeHead(200);
    response.end(JSON.stringify(result));
    return;
  }
  this.flagPrintingToConsole = false;
  this.argumentList = [];
  var argumentsNonSplit = queryCommand.arguments;
  if (typeof argumentsNonSplit === "string" && argumentsNonSplit !== "") {
    var currentArguments = argumentsNonSplit.split(' ');
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
          this.configuration.RPCPort = 38667;
          break;
        case "-regtestwithnet":
        case "--regtestwithnet":
          this.configuration.network = "-regtestwithnet";
          this.configuration.RPCPort = 40667;
          break;
        default:
        this.argumentList.push(current);
          break;
      }
    }
  }
  //this.outputStreams.fabcoind.log(`DEBUG: input queryCommand: ${JSON.stringify(queryCommand)}`);
  this.argumentList.push(`-rpcpassword=${this.configuration.RPCPassword}`);
  this.argumentList.push(`-rpcuser=${this.configuration.RPCUser}`);
  this.argumentList.push(`-datadir=${this.paths.dataDir}`);
  this.argumentList.push(`-txindex=1`);
  this.argumentList.push(`-logevents`);
  if (typeof queryCommand.smartContractId === "string" && queryCommand.smartContractId !== "") {
    this.argumentList.push(`-kanbanSmartContractId=${queryCommand.smartContractId}`);
  }
  this.flagStarted = true;
  this.flagStartWasEverAttempted = true;
  var options = {
    cwd: this.paths.executablePath,
    env: process.env
  };
  if (this.configuration.network !== "") {
    this.argumentList.push(this.configuration.network);
  }
  this.runShell(this.paths.executableFileName, this.argumentList, options, null, this.outputStreams.fabcoind);
  response.writeHead(200);
  response.end(JSON.stringify(this.outputStreams.fabcoind.toArray()));
  return;
}

FabcoinNode.prototype.killAllFabcoindCallback = function (response) {
  this.flagStarted = false;
  response.writeHead(200);
  response.end(JSON.stringify(this.outputStreams.command.toArray()));
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
