"use strict";
const submitRequests = require('../submit_requests');

const ids = require('../ids_dom_elements');
const jsonToHtml = require('../json_to_html');
const cryptoKanban = require('../../crypto/crypto_kanban');
const encodingDefault = require('../../crypto/encodings').encodingDefault;

function TestKanbanJS() {
  var inputSchnorr = ids.defaults.kanbanJS.inputSchnorr;
  this.theFunctions  = {
    testSha3 : {
      //<- must equal the label of the rpc call in the kanbanGO.rpcCalls data structure.
      //Setting rpcCall to null or undefined is allowed:
      //if that happens, in this.correctFunctions() 
      //we set rpcCall to the natural default - the function label.
      //If that default is not an rpc call, an error will 
      //conveniently be thrown to let you know of the matter.
      inputs: {
        message: inputSchnorr.message
      }
    },
    testRipemd160 : {
      inputs: {
        message: inputSchnorr.message
      }
    },
    testKeccak: {
      inputs: {
        message: inputSchnorr.message
      }
    },
    testPublicKeyFromPrivate: {
      inputs: {
        privateKey: inputSchnorr.privateKey
      },
      outputs: {
        publicKeyHex: inputSchnorr.publicKey
      }
    },
    testPrivateKeyGeneration: {
      outputs: {
        privateKeyHex: inputSchnorr.privateKey
      }
    },
    testFABAddress: {
      inputs: {
        publicKeyHex: inputSchnorr.publicKey
      }
    },
    testEthereumAddress: {
      inputs: {
        publicKeyHex: inputSchnorr.publicKey
      }
    }
  };
}

var optionsForKanbanJSStandard = {};

TestKanbanJS.prototype.updateFields = function(parsedInput, outputs) {
  if (parsedInput === undefined) {
    return;
  }
  for (var label in outputs) {
    if (typeof outputs[label] === "string") {
      submitRequests.updateValue(outputs[label], parsedInput[label]);
    } else {
      this.updateFields(parsedInput[label], outputs[label]);
    }
  }
}

TestKanbanJS.prototype.callbackStandard = function(functionLabel, input) {
  var theJSONWriter = new jsonToHtml.JSONTransformer();
  var resultHTML = theJSONWriter.getHtmlFromArrayOfObjects(input, optionsForKanbanJSStandard);
  var header = "";
  if (input.resultHTML !== null && input.resultHTML !== undefined) {
    header += input.resultHTML + "<br>"; 
  }
  if (input.error !== null && input.error !== undefined) {
    header += `<b style = 'color:red'>Error:</b> <span style='color:red'>${input.error}</span><br>`;
  }
  if (input.reason !== null && input.reason !== undefined) {
    header += input.reason + "<br>";
  }
  resultHTML = header + resultHTML;
  document.getElementById(ids.defaults.kanbanJS.outputKBJSCrypto).innerHTML = resultHTML;
  theJSONWriter.bindButtons();
  var currentFunction = this.theFunctions[functionLabel];
  this.updateFields(input, currentFunction.outputs);
}

TestKanbanJS.prototype.testSha3 = function(theArguments) {
  var result = {};
  result.input = theArguments;
  result.resultBufferedThenHexed = Buffer.from(cryptoKanban.hashes.sha3_256(theArguments.message)).toString('hex');
  result.resultHex = cryptoKanban.hashes.sha3_256_ToHex(theArguments.message);
  return result;
}

TestKanbanJS.prototype.testRipemd160 = function(theArguments) {
  var result = {};
  result.input = theArguments;
  result.resultBufferedThenHexed = Buffer.from(cryptoKanban.hashes.ripemd160(theArguments.message)).toString('hex');
  result.resultHex = cryptoKanban.hashes.ripemd160_ToHex(theArguments.message);
  return result;
}

TestKanbanJS.prototype.testKeccak = function(theArguments) {
  var result = {};
  result.input = theArguments;
  result.resultBufferedThenHexed = Buffer.from(cryptoKanban.hashes.keccak_256(theArguments.message)).toString('hex');
  result.resultHex = cryptoKanban.hashes.keccak_ToHex(theArguments.message);
  return result;
}

TestKanbanJS.prototype.testPublicKeyFromPrivate = function(theArguments) {
  var result = {};
  result.input = theArguments;
  var curveExponent = new cryptoKanban.CurveExponent();
  curveExponent.fromArbitrary(theArguments.privateKey);
  if (!curveExponent.isInitialized()) {
    result.error = "Exponent generation failed. ";
    return result;
  }
  result.privateKeyHexRecoded = curveExponent.toHex();
  result.publicKeyUncompressedHex = curveExponent.getExponent().toHexUncompressed()
  result.publicKeyHex = curveExponent.getExponent().toHex();
  return result;
}

TestKanbanJS.prototype.testPrivateKeyGeneration = function(theArguments) {
  var result = {};
  var curveExponent = new cryptoKanban.CurveExponent();
  curveExponent.generateAtRandom();
  result.privateKeyHex = curveExponent.toHex();
  return result;
}

TestKanbanJS.prototype.testEthereumAddress = function(theArguments) {
  var result = {};
  result.input = theArguments;
  var publicKey = new cryptoKanban.CurvePoint();
  publicKey.fromHex(theArguments.publicKeyHex);
  result.ethereumAddress = publicKey.computeEthereumAddressHex();
  return result;
}

TestKanbanJS.prototype.testFABAddress = function(theArguments) {
  var result = {};
  result.input = theArguments;
  var publicKey = new cryptoKanban.CurvePoint();
  publicKey.fromArbitrary(theArguments.publicKeyHex);
  var theBytes = publicKey.computeFABAddressBytes();
  result.FABAddressBase58 = encodingDefault.toBase58(theBytes);
  result.FABAddressBase58Check = encodingDefault.toBase58Check(theBytes);
  result.FABAddressHex = encodingDefault.toHex(theBytes);
  return result;
}

TestKanbanJS.prototype.run = function(functionLabel) {
  var theFunction = this.theFunctions[functionLabel];
  if (theFunction === null || theFunction === undefined) {
    throw (`Unknown function call label: ${functionLabel}`);
  }
  var theArguments = {};
  var currentInputs = theFunction.inputs;
  for (var inputLabel in currentInputs) {
    theArguments[inputLabel] = document.getElementById(currentInputs[inputLabel]).value;
  }
  var currentInputsBase64 = theFunction.inputsBase64;
  if (currentInputsBase64 !== null && currentInputsBase64 !== undefined) {
    for (var inputLabel in currentInputsBase64) {
      var theValue =  document.getElementById(currentInputsBase64[inputLabel]).value;
      theArguments[inputLabel] = Buffer.from(theValue).toString('base64');
    }
  }
  var result = this[functionLabel](theArguments);
  this.callbackStandard(functionLabel, result)
}

var testFunctions = new TestKanbanJS();

module.exports = {
  testFunctions
}