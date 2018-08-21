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
    }
  };
  this.correctFunctions();
}

TestKanbanGO.prototype.correctFunctions = function() {  
  for (var label in this.theFunctions) {
    var currentCall = this.theFunctions[label];
    if (currentCall.rpcCall === null || currentCall.rpcCall === undefined) {
      currentCall.rpcCall = label; 
      if (label !== kanbanGO.rpcCalls[label].rpcCall) {
        throw(`Fatal error: kanbanGO rpc label ${label} doesn't equal the expecte value ${kanbanGO.rpcCalls[label].rpcCall}.`);
      }
    }
  }
}

var optionsForKanbanGOStandard = {};

TestKanbanGO.prototype.callbackStandard = function(functionLabel, input, output) {
  console.log("DEBUG fun label: " + functionLabel)
  jsonToHtml.writeJSONtoDOMComponent(input, output, optionsForKanbanGOStandard);
  var theFunction = this.theFunctions[functionLabel];
  if (theFunction.outputs === null || theFunction.outputs === undefined) {
    return;
  }
  var parsedInput = JSON.parse(input);
  for (var label in theFunction.outputs) {
    submitRequests.updateValue(theFunction.outputs[label], parsedInput[label]);
  }
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
  var messageBody = pathnames.getPOSTBodyFromKanbanGORPCLabel(theFunction.rpcCall, theArguments);
  var theURL = `${pathnames.url.known.goKanbanRPC}`;
  var currentResult = ids.defaults.kanbanGO.outputSchnorr;
  var currentProgress = globals.spanProgress();
  var usePOST = window.kanban.rpc.forceRPCPOST;
  if (!usePOST) {
    if (messageBody.length > 1000) {
      usePOST = true;
    }
  }
  if (usePOST) {
    submitRequests.submitPOST({
      url: theURL,
      messageBody: messageBody,
      progress: currentProgress,
      callback: this.callbackStandard.bind(this, functionLabel),
      result: currentResult
    });
  } else {
    theURL += `?command=${messageBody}`;
    submitRequests.submitGET({
      url: theURL,
      progress: currentProgress,
      callback: this.callbackStandard.bind(this, functionLabel),
      result: currentResult
    });
  }
}

var testFunctions = new TestKanbanGO();

module.exports = {
  testFunctions
}