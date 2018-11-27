"use strict";
const solidity = require('./../../solidity_abi').solidity;
const encodingDefault = require('../../crypto/encodings').encodingDefault;
const fabcoinRPC = require('./rpc');
const ResponseWrapper = require('../../response_wrapper').ResponseWrapper;
var hashers = require('../../crypto/hashes').hashes;

function getRPCHandlers() {
  return global.fabcoinHandlersRPC;
}

function Demo () {
  /**@type {string} */
  this.smartContractId = "";
  this.ABI = null;
}

Demo.prototype.demoRegisterSmartContractAndABI = function(
  /** @type {ResponseWrapper} */ 
  response, 
  theArgumentsUnused,
  queryCommand,
) {
  var result = {};
  result.input = queryCommand;
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
  this.smartContractId = queryCommand.smartContractId;
  try {
    console.log("Incoming smart contract abi: " + queryCommand.ABI);
    var incomingABI = unescape(queryCommand.ABI);
    this.ABI = JSON.parse(incomingABI);
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

Demo.prototype.demoRegisterCorporation = function (
  /** @type {ResponseWrapper} */ 
  response, 
  theArgumentsUnused,
  queryCommand,
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

Demo.prototype.demoGetNonce = function(response) {
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

Demo.prototype.demoIssuePoints = function(
  /** @type {ResponseWrapper} */
  response, 
  theArgumentsUnused, 
  queryCommand,
) {
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

Demo.prototype.demoGetAllCorporations = function(response) {
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

var demo = new Demo()

module.exports = {
  demo
}
