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
  var mandatoryArguments = spec.mandatoryModifiableArguments;
  if (mandatoryArguments !== undefined && mandatoryArguments !== null) {
    for (var label in spec.mandatoryModifiableArguments) {
      if (!label in queryCommand) {
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
  if (!(theCallLabel in fabcoinInitializationSpec.rpcCalls)) {
    response.writeHead(400);
    return response.end(`{"error": "Fabcoin initialization call ${theCallLabel} not found. "}`);    
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
    var result = {
      error: `Server error: handler ${theCallLabel} declared but no implementation found.`
    };
    return response.end(JSON.stringify(result));
  }
  /**@type {string[]} */
  var theArguments = [];
  var errors = [];
  if (!this.getArgumentsFromSpec(fabcoinInitializationSpec.rpcCalls[theCallLabel], queryCommand, theArguments, errors)) {
    response.writeHead(400);
    result = {
      error: errors[0]
    };
    response.end(JSON.stringify(result));
    return;
  }
  try {
    return (currentFunction.bind(this))(response, theArguments, queryCommand);
  } catch (e) {
    response.writeHead(500);
    var result = {
      error: `Server error at handleRPCArguments: ${e}. Call label: ${theCallLabel}. `
    };
    return response.end(JSON.stringify(result));
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

function Demo () {
  /**@type {string} */
  this.smartContractId = "";
  this.ABI = null;
}

var demo = new Demo();

Demo.prototype.registerDefaultSmartContractAndABI = function(
  /** @type {ResponseWrapperWithLimits} */ 
  response, 
  theArguments  
) {
  var result = {};
  result.input = theArguments;
  if (this.smartContractId !== "" && this.smartContractId !== null && this.smartContractId !== undefined) {
    result.resultHTML = "";
    result.resultHTML += `<b style = 'color:red'>Smart contract already registered. </b>`;
    result.resultHTML += `If you want to register a new one, please restart the system manually. `;
    result.resultHTML += `Attached are the registered contract id and ABI. `;
    result.smartContractId = this.smartContractId;
    result.ABI = this.ABI;
    response.writeHead(200);    
    response.end(JSON.stringify(result));
    return;
  }
  this.smartContractId = theArguments.smartContractId;
  try {
    this.ABI = JSON.parse(theArguments.ABI);
    result.smartContractId = this.smartContractId;
    result.ABI = this.ABI;
    solidity.contractIdDefault = this.smartContractId;
    solidity.ABI = this.ABI;
  } catch (e) {
    result.error = `Failed to parse the smart contract ABI. ${e}`;
  }
  response.writeHead(200);
  response.end(JSON.stringify(result));
}

Demo.prototype.isInitialized = function (response) {
  var result = {
    error: null,
    help: "Please call the demoRegisterSmartContractAndABI to register a new smart contract. "
  };
  if (this.ABI === undefined || this.ABI === null) {
    result.error = `ABI not intialized.`;
  }
  if (this.smartContractId === "" || this.smartContractId === null || this.smartContractId === undefined) {
    result.label = "Smart contract id not initialized. ";
  }
  if (result.error !== null) {
    response.writeHead(200);
    response.end(JSON.stringify(result));
    return false;
  }
  return true;
}

Demo.prototype.registerCorporation = function (
  /** @type {ResponseWrapperWithLimits} */ 
  response, 
  queryCommand
) {
  if (! this.isInitialized(response)) {
    return;
  }
  queryCommand.rpcCall = "getNewAddress";
  getRPCHandlers().handleRPCArguments(response, queryCommand, this.demoRegisterCorporationPart2.bind(this, queryCommand));
}

Demo.prototype.demoRegisterCorporationPart2 = function (originalInput, response, dataParsed) {
  var result = {};
  console.log("DEBUG: got to here pt 1");
  result.input = originalInput;
  result.addressGenerated = {};
  result.addressGenerated.base58 = dataParsed.result;
  //console.log("DEBUG: got to here pt 2");
  //console.log(`debug Data parsed: ${JSON.stringify(dataParsed.result)}`);
  var decoded = encodingDefault.fromBase58(result.addressGenerated.base58);
  //console.log("DEBUG: got to here pt 3");
  var sliced = decoded.slice(1,21);
  //console.log("DEBUG: got to here pt 4");
  var hexed = sliced.toString('hex');
  //console.log("DEBUG: got to here pt 5");
  result.addressGenerated.hex = hexed;
  //console.log("DEBUG: got to here pt 3");
  //console.log("DEBUG: got to here pt 3");
  originalInput["_fabAddress"]  = hexed;
  result.abiPacking = solidity.getABIPackingForFunction("registerCompany", originalInput);
  var sendToContract = fabcoinRPC.rpcCalls.sendToContract;
  var newCommand = {
    rpcCall: sendToContract.rpcCall,
    contractId: this.smartContractId,
    data: result.abiPacking,
    amount: 0,
  };
  getRPCHandlers().handleRPCArguments(response, newCommand, this.demoRegisterCorporationPart3.bind(this, result));
}

Demo.prototype.demoRegisterCorporationPart3 = function (result, response, dataParsed) {
  result.sendToContractResult = dataParsed;
  var generateBlocks = fabcoinRPC.rpcCalls.generateBlocks;
  var newCommand = {
    rpcCall: generateBlocks.rpcCall,
    numberOfBlocks: 1,
  }
  getRPCHandlers().handleRPCArguments(response, newCommand, this.demoRegisterCorporationPart4.bind(this, result));
}

Demo.prototype.demoRegisterCorporationPart4 = function(result, response, dataParsed) {
  result.generateOneBlock = dataParsed;
  response.writeHead(200);
  response.end(JSON.stringify(result));
}

Demo.prototype.getNonce = function(response) {
  if (! this.isInitialized(response)) {
    return;
  }
  var result = {};
  result.query = solidity.getQueryCallContractForFunction("getNonce", {});
  getRPCHandlers().handleRPCArguments(response, result.query, this.getAllNoncePart2.bind(this, result));
}

Demo.prototype.getAllNoncePart2 = function(result, response, parsedData) {
  result.parsedData = parsedData;
  try {
    var unpacked = solidity.unpackABIResultForFunction("getNonce", parsedData.result.executionResult.output);
    response.writeHead(200);
    response.end(JSON.stringify(unpacked.nonceCurrent));
  } catch (e) {
    result.error = `Failed to get nonce: ${e}`;
    response.writeHead(200);
    response.end(JSON.stringify(result));
  }
}

Demo.prototype.issuePoints = function(response, queryCommand) {
  if (! this.isInitialized(response)) {
    return;
  }
  console.log(`DEBUG: got to here. pt 1.`)
  var nonceQuery = solidity.getQueryCallContractForFunction("getNonce", {});
  console.log(`DEBUG: got to here. pt 2. nonceQuery: ${JSON.stringify(nonceQuery)}`)
  getRPCHandlers().handleRPCArguments(response, nonceQuery, this.issuePointsPart2.bind(this, queryCommand));
}

Demo.prototype.issuePointsPart2 = function(queryCommand, response, dataParsed) {
  var result = {};
  result.query = queryCommand;
  console.log(`DEBUG: got to iss pts part 2. ${JSON.stringify(dataParsed)}.`)
  result.nonce = solidity.unpackABIResultForFunction("getNonce", dataParsed.result.executionResult.output);
  console.log(`DEBUG: got to here. nonce: ${result.nonce}.`)
  result.nonceToNumber = Number(result.nonce);
  console.log(`DEBUG: got to here. nonceToNumber: ${result.nonceToNumber}.`)
  result.queryIssuePts = solidity.getQueryCallContractForFunction("getAllCompanies", {
    nonce: result.nonceToNumber, 
    corporationNameHex: queryCommand.corporationNameHex,
  });
  result.queryIssuePts = solidity.getQueryCallContractForFunction("issuePoints", queryCommand);
  console.log("DEBUG: about to submit: " + JSON.stringify(result.queryIssuePts)); 
  getRPCHandlers().handleRPCArguments(response, result.queryIssuePts, this.issuePointsPart3.bind(this, result));  
}

Demo.prototype.issuePointsPart3 = function(result, response, dataParsed) {
  result.issuePointsResult = dataParsed;
  result.aRaw =  dataParsed.result.executionResult.output;
  result.unpackedIssuePoints = solidity.unpackABIResultForFunction("issuePoints", dataParsed.result.executionResult.output);
  var nonKeccaked = result.query.corporationNameHex + result.query.moneySpent + JSON.stringify(result.nonce);
  var keccakedReceipt = hashers.keccak_ToHex(nonKeccaked);
  result.transaction = {
    companyName: encodingDefault.fromHex(result.query.corporationNameHex).toString(),
    amount: result.query.moneySpent,
    nonce: keccakedReceipt,
  };
  result.transaction.info =`${result.transaction.companyName}, ${result.transaction.amount}, ${result.transaction.nonce.slice(0,6)}`;

  //  {info: "Company, amount, hex"}
  result.sendToContractResult = dataParsed;
  var generateBlocks = fabcoinRPC.rpcCalls.generateBlocks;
  var newCommand = {
    rpcCall: generateBlocks.rpcCall,
    numberOfBlocks: 1,
  }
  getRPCHandlers().handleRPCArguments(response, newCommand, this.issuePointsPart4.bind(this, result));
}

Demo.prototype.issuePointsPart4 = function(result, response, dataParsed) {
  response.writeHead(200);
  response.end(JSON.stringify(result.transaction));
}

Demo.prototype.getAllCorporations = function(response) {
  if (! this.isInitialized(response)) {
    return;
  }
  var result = {};
  result.query = solidity.getQueryCallContractForFunction("getAllCompanies", {});
  console.log(`DEBUG: Got to here: about to submit:  ${JSON.stringify(result.query)}`);
  getRPCHandlers().handleRPCArguments(response, result.query, this.getAllCorporationsPart2.bind(this, result));
}

Demo.prototype.getAllCorporationsPart2 = function (result, response, dataParsed) {
  console.log("DEBUG: Here I am jh ")
  result.resultData = dataParsed;
  var resultMinimal = {};
  try {
    result.unpacked = solidity.unpackABIResultForFunction("getAllCompanies", dataParsed.result.executionResult.output);
    console.log("DEBUG: Got unpacked: " + JSON.stringify(result.unpacked));
    var unpacked = result.unpacked;
    for (var i = 0; i < unpacked.companyNames.length; i ++ ) {
      console.log("DEBUG: Got to here: pt 0");
      var currentName = encodingDefault.fromHex(unpacked.companyNames[i]).toString();
      console.log("DEBUG: Got to here: pt 1");
      var creationNumber = Number (unpacked.companyCreationNumbers[i]);
      console.log("DEBUG: Got to here: pt 2");
      resultMinimal[currentName] = {creationNumber: creationNumber}
    }
  } catch (e) {
    result.error = `Error unpacking call contract result. ${e}`;
    response.writeHead(200);
    response.end(JSON.stringify(result));
  }
  response.writeHead(200);
  response.end(JSON.stringify(resultMinimal));
}

FabcoinNode.prototype.demoRegisterCorporation = function (
  /** @type {ResponseWrapperWithLimits} */ 
  response, 
  theArguments, 
  queryCommand,
) {
  demo.registerCorporation(response, queryCommand);
}

FabcoinNode.prototype.demoIssuePoints = function (
  /** @type {ResponseWrapperWithLimits} */ 
  response, 
  theArguments, 
  queryCommand,
) {
  demo.issuePoints(response, queryCommand);
}

FabcoinNode.prototype.demoGetNonce = function (
  /** @type {ResponseWrapperWithLimits} */ 
  response, 
  theArguments, 
  queryCommand,
) {
  demo.getNonce(response);
}

FabcoinNode.prototype.demoRegisterSmartContractAndABI = function(response, theArguments, queryCommand) {
  demo.registerDefaultSmartContractAndABI(response, queryCommand);
}

FabcoinNode.prototype.demoGetAllCorporations = function (response, theArguments, queryCommand) {
  demo.getAllCorporations (response);
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
