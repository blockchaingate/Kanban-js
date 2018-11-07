"use strict";
const ids = require('../ids_dom_elements');
const fabcoinRPC = require('../../external_connections/fabcoin/rpc');
const pathnames = require('../../pathnames');
const globals = require('../globals');
const submitRequests = require('../submit_requests');
const jsonToHtml = require('../json_to_html');

function FabcoinNodeInitializer() {
  this.idOutput = ids.defaults.outputFabcoinInitialization;
  var inputInitialization = ids.defaults.fabcoin.inputInitialization;
  this.theFunctions = {
    runFabcoind: {
      inputs: {
        arguments: inputInitialization.fabcoindArguments
      }
    },
  };
}

var optionsForKanbanGOStandard = {};
FabcoinNodeInitializer.prototype.callbackStandard = function(functionLabel, input, output) {
  var transformer = new jsonToHtml.JSONTransformer();
  transformer.writeJSONtoDOMComponent(input, output, optionsForKanbanGOStandard);
}

FabcoinNodeInitializer.prototype.getArguments = function(functionLabel) {
  var theArguments = {};
  var functionFrontend = this.theFunctions[functionLabel];
  if (functionFrontend === null || functionFrontend === undefined) {
    return theArguments;
  }
  var currentInputs = functionFrontend.inputs;
  for (var inputLabel in currentInputs) {
    var inputId = currentInputs[inputLabel];
    theArguments[inputLabel] = document.getElementById(inputId).value;
  }
  var currentInputsBase64 = functionFrontend.inputsBase64;
  if (currentInputsBase64 !== null && currentInputsBase64 !== undefined) {
    for (var inputLabel in currentInputsBase64) {
      var theValue =  document.getElementById(currentInputsBase64[inputLabel]).value;
      theArguments[inputLabel] = Buffer.from(theValue).toString('base64');
    }
  }
  return theArguments;
}

FabcoinNodeInitializer.prototype.run = function(functionLabel, callbackOverridesStandard, manualInputs) {
  //console.log(`DEBUG: running ${functionLabel}. `);
  var theArguments = this.getArguments(functionLabel);
  if (manualInputs !== null && manualInputs !== undefined) {
    theArguments = Object.assign(theArguments, manualInputs);
  }
  var messageBody = fabcoinRPC.getPOSTBodyFromRPCLabel(functionLabel, theArguments);
  var theURL = `${pathnames.url.known.fabcoin.initialization}`;
  var currentResult = ids.defaults.fabcoin.outputFabcoinInitialization;
  var currentProgress = globals.spanProgress();
  var callbackCurrent = this.callbackStandard;
  var functionFrontend = this.theFunctions[functionLabel];
  if (functionFrontend !== undefined) {
    if (functionFrontend.callback !== undefined && functionFrontend.callback !== null) {
      callbackCurrent = functionFrontend.callback;
    }  
  }
  if (callbackOverridesStandard !== null && callbackOverridesStandard !== undefined) {
    callbackCurrent = callbackOverridesStandard;
  } else {
    callbackCurrent = callbackCurrent.bind(this, functionLabel);
  }
  theURL += `?command=${messageBody}`;
  submitRequests.submitGET({
    url: theURL,
    progress: currentProgress,
    callback: callbackCurrent,
    result: currentResult
  });
}

var initializer = new FabcoinNodeInitializer();

module.exports = {
  initializer
}