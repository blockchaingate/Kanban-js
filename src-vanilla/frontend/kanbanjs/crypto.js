"use strict";
const submitRequests = require('../submit_requests');

const ids = require('../ids_dom_elements');
const jsonToHtml = require('../json_to_html');
const cryptoKanban = require('../../crypto/crypto_kanban');

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

TestKanbanJS.prototype.callbackStandard = function(input) {
  jsonToHtml.writeJSONtoDOMComponent(input, ids.defaults.kanbanJS.outputKBJSCrypto, optionsForKanbanJSStandard);
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
  var curveExponent = new cryptoKanban.CurveExponent(Buffer.from(theArguments.privateKey, 'hex'));
  result.privateKeyHexRecoded = curveExponent.toHex();
  result.publicKeyHex = curveExponent.getExponent().toHex();
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
  this.callbackStandard(result)
}

var testFunctions = new TestKanbanJS();

module.exports = {
  testFunctions
}