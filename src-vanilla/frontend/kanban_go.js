"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');

const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
//const Block = require('../bitcoinjs_src/block');
const globals = require('./globals');
const miscellaneous = require('../miscellaneous');
const miscellaneousFrontEnd = require('./miscellaneous_frontend');
const kanbanGO = require('../resources_kanban_go');

function TestKanbanGO() {
  var inputSchnorr = ids.defaults.kanbanGO.inputSchnorr;
  var inputAggregate = ids.defaults.kanbanGO.inputAggregateSignature;
  this.theFunctions  = {
    testSha3 : {
      rpcCall: kanbanGO.rpcCalls.testSha3.rpcCall, 
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
    versionGO: {
    },
    testPrivateKeyGeneration: {
      outputs: {
        privateKeyBase58Check: inputSchnorr.privateKey
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
    testSchnorrSignature: {
      inputs: {
        privateKey: inputSchnorr.privateKey
      },
      inputsBase64: {
        messageBase64: inputSchnorr.message
      },
      outputs: {
        signatureBase58: inputSchnorr.signature
      }
    },
    testSchnorrVerification: {
      inputs: {
        publicKey: inputSchnorr.publicKey,
        signature: inputSchnorr.signature
      },
      inputsBase64: {
        messageBase64: inputSchnorr.message
      },
      callback: this.callbackStandard
    },
    testAggregateInitialize: {
      inputs: {
        numberOfPrivateKeysToGenerate: inputAggregate.numberOfPrivateKeysToGenerate
      },
      callback: this.callbackAggregateInitialization
    },
    testAggregateCommitment: {
      inputsBase64: {
        messageBase64: inputAggregate.message
      },
      callback: this.callbackAggregateCommitment
    },
    testAggregateChallenge: {
      inputs: {        
        committedSigners: inputAggregate.committedSignersBitmap
      },
      inputsBase64: {
        commitmentsBase64: inputAggregate.commitments,
      },
      outputs: {
        aggregator: {
          aggregateCommitment: inputAggregate.aggregateCommitment,
          aggregatePublicKey: inputAggregate.aggregatePublickey,
          messageDigest: inputAggregate.digest
        }
      }
    },
    testAggregateSolutions: {
      inputs: {
        committedSigners: inputAggregate.committedSignersBitmap,
        digest: inputAggregate.digest,
        aggregateCommitment: inputAggregate.aggregateCommitment,
        aggregatePublicKey: inputAggregate.aggregatePublickey
      },
      callback: this.callbackAggregateSolutions
    },
    testAggregateSignature: {
      inputs: {
        committedSigners: inputAggregate.committedSignersBitmap,
      },
      inputsBase64: {
        solutionsBase64: inputAggregate.solutions,
      },
      outputs: {
        aggregator: {
          signatureNoBitmap: inputAggregate.aggregateSignature
        }
      }
    },
    testAggregateVerification: {
      inputsBase64: {
        messageBase64: inputAggregate.message,
        allPublicKeysBase64: inputAggregate.publicKeys,
      },
      inputs: {
        signature: inputAggregate.aggregateSignature,
        committedSigners: inputAggregate.committedSignersBitmap,
      },
      callback: this.callbackStandard
    },
  };
  this.correctFunctions();
}

function getSignerField(input, label) {
  var parsedInput = JSON.parse(input);
  var result = [];
  if (parsedInput.signers === null || parsedInput.signers === undefined) {
    return result;
  }
  for (var i = 0; i < parsedInput.signers.length; i ++) {
    var incoming = parsedInput.signers[i][label];
    if (incoming === "" || incoming === null || incoming === undefined) {
      incoming = "(ignored)";
    }
    result.push(incoming);
  }
  return result;
}

TestKanbanGO.prototype.callbackAggregateSolutions = function(functionLabel, input, output) {
  this.callbackStandard(functionLabel, input, output);
  var solutions = getSignerField(input, "mySolution");
  submitRequests.updateValue(ids.defaults.kanbanGO.inputAggregateSignature.solutions, solutions.join(", "));
}

TestKanbanGO.prototype.callbackAggregateInitialization = function(functionLabel, input, output) {
  this.callbackStandard(functionLabel, input, output);
  var privateKeys = getSignerField(input, "privateKeyBase58");
  var publicKeys = getSignerField(input, "myPublicKey");
  submitRequests.updateValue(ids.defaults.kanbanGO.inputAggregateSignature.privateKeys, privateKeys.join(", "));
  submitRequests.updateValue(ids.defaults.kanbanGO.inputAggregateSignature.publicKeys, publicKeys.join(", "));
}

TestKanbanGO.prototype.callbackAggregateCommitment = function(functionLabel, input, output) {
  this.callbackStandard(functionLabel, input, output);
  var commitments = getSignerField(input, "commitmentHexCompressed");
  var nonces = getSignerField(input, "myNonceBase58");
  submitRequests.updateValue(ids.defaults.kanbanGO.inputAggregateSignature.commitments, commitments.join(", "));
  submitRequests.updateValue(ids.defaults.kanbanGO.inputAggregateSignature.nonces, nonces.join(", "));
}

TestKanbanGO.prototype.correctFunctions = function() {  
  for (var label in this.theFunctions) {
    var currentCall = this.theFunctions[label];
    if (currentCall.rpcCall === null || currentCall.rpcCall === undefined) {
      currentCall.rpcCall = label; 
      if (label !== kanbanGO.rpcCalls[label].rpcCall) {
        throw(`Fatal error: kanbanGO rpc label ${label} doesn't equal the expected value ${kanbanGO.rpcCalls[label].rpcCall}.`);
      }
    }
  }
}

var optionsForKanbanGOStandard = {};

TestKanbanGO.prototype.updateFields = function(parsedInput, outputs) {
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

TestKanbanGO.prototype.callbackStandard = function(functionLabel, input, output) {
  var resultHTML = jsonToHtml.getHtmlFromArrayOfObjects(input, optionsForKanbanGOStandard);
  var theFunction = this.theFunctions[functionLabel];
  var parsedInput = JSON.parse(input);
  if (typeof output === "string") {
    output = document.getElementById(output);
  }
  var header = "";
  if (parsedInput.resultHTML !== null && parsedInput.resultHTML !== undefined) {
    header += parsedInput.resultHTML + "<br>"; 
  }
  if (parsedInput.error !== null && parsedInput.error !== undefined) {
    header += `<b>Error:</b> <span style='color:red'>${parsedInput.error}</span><br>`;
  }
  if (parsedInput.reason !== null && parsedInput.reason !== undefined) {
    header += parsedInput.reason + "<br>";
  }
  resultHTML = header + resultHTML;
  output.innerHTML = resultHTML;
  if (theFunction.outputs === null || theFunction.outputs === undefined) {
    return;
  }
  this.updateFields(parsedInput, theFunction.outputs);
}

TestKanbanGO.prototype.testClear = function() {
  var inputAggregate = ids.defaults.kanbanGO.inputAggregateSignature;
  submitRequests.updateValue(inputAggregate.numberOfPrivateKeysToGenerate, '5');
  submitRequests.updateValue(inputAggregate.privateKeys, '');
  submitRequests.updateValue(inputAggregate.nonces, '');
  submitRequests.updateValue(inputAggregate.publicKeys, '');
  submitRequests.updateValue(inputAggregate.committedSignersBitmap, '01111');
  submitRequests.updateValue(inputAggregate.commitments, '');
  submitRequests.updateValue(inputAggregate.digest, '');
  submitRequests.updateValue(inputAggregate.aggregateCommitment, '');
  submitRequests.updateValue(inputAggregate.aggregatePublickey, '');
  submitRequests.updateValue(inputAggregate.solutions, '');
  submitRequests.updateValue(inputAggregate.aggregateSignature, '');
}

TestKanbanGO.prototype.run = function(functionLabel) {
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
  var messageBody = pathnames.getPOSTBodyFromKanbanGORPCLabel(theFunction.rpcCall, theArguments);
  var theURL = `${pathnames.url.known.goKanbanRPC}`;
  var currentResult = ids.defaults.kanbanGO.outputKBGOTest;
  var currentProgress = globals.spanProgress();
  var usePOST = window.kanban.rpc.forceRPCPOST;
  if (!usePOST) {
    if (messageBody.length > 1000) {
      usePOST = true;
    }
  }
  var callbackCurrent = this.callbackStandard;
  if (theFunction.callback !== undefined && theFunction.callback !== null) {
    callbackCurrent = theFunction.callback;
  }  
  callbackCurrent = callbackCurrent.bind(this, functionLabel);
  if (usePOST) {
    submitRequests.submitPOST({
      url: theURL,
      messageBody: messageBody,
      progress: currentProgress,
      callback: callbackCurrent,
      result: currentResult
    });
  } else {
    theURL += `?command=${messageBody}`;
    submitRequests.submitGET({
      url: theURL,
      progress: currentProgress,
      callback: callbackCurrent,
      result: currentResult
    });
  }
}

var testFunctions = new TestKanbanGO();

module.exports = {
  testFunctions
}