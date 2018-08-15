"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
//const Block = require('../bitcoinjs_src/block');
const globals = require('./globals');
const miscellaneous = require('../miscellaneous');
const miscellaneousFrontEnd = require('./miscellaneous_frontend');

function TestKanbanGO() {
  var inputsSchnorr = ids.defaults.kanbanGO.inputSchnorr;
  this.theFunctions  = {
    testSha3 : {
      rpcCall: pathnames.rpcCallsKanbanGO.testSha3,
      inputs: {
        message: inputsSchnorr.message
      }
    }
  }
}

var optionsForKanbanGOStandard = {};

function callbackKanbanGOStandard(input, output) {
  jsonToHtml.writeJSONtoDOMComponent(input, output, optionsForKanbanGOStandard);
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
  var currentCallback = callbackKanbanGOStandard;
  var currentResult = ids.defaults.kanbanGO.outputSchnorr;
  var currentProgress = global.spanProgress();
  var usePOST = window.kanebn.rpc.forceRPCPOST;
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
      callback: currentCallback,
      result: currentResult
    });
  } else {
    theURL += `?command=${messageBody}`;
    submitRequests.submitGET({
      url: theURL,
      progress: currentProgress,
      callback: currentCallback,
      result: currentResult
    });
  }
}


var testFunctions = new TestKanbanGO();

module.exports = {
  testFunctions,
  callbackKanbanGOStandard
}