"use strict";
const fabRPCSpec = require('../../external_connections/fabcoin/rpc');
const pathnames = require('../../pathnames');
const ids = require('../ids_dom_elements');
const globals = require('../globals');
const submitRequests = require('../submit_requests');
const jsonToHtml = require('../json_to_html');

function FabNode () {
  this.theFunctions = {
    getBlockByHeight: {
      inputs: {
        blockNumber: ids.defaults.fabcoin.inputBlockInfo.blockNumber
      }    
    }
    //for labels please use the name of the rpc call found in fabRPCSpec.rpcCalls
  };
}

FabNode.prototype.convertToCorrectType = function(functionLabel, variableName, inputRaw) {
  if (!(functionLabel in fabRPCSpec.rpcCalls)) {
    throw `While converting types, failed to find function ${functionLabel}`;
  }
  var currentFunction = fabRPCSpec.rpcCalls[functionLabel];
  if (currentFunction.types === undefined || currentFunction.types === null) {
    return inputRaw;
  }
  var currentType = currentFunction.types[variableName]; 
  if (currentType === undefined || currentType === null) {
    return inputRaw;
  }
  if (currentType === "number") {
    return Number(inputRaw);
  }
  return inputRaw;
}

FabNode.prototype.getArguments = function(functionLabel) {
  if (! (functionLabel in fabRPCSpec.rpcCalls) ) {
    throw (`Function label ${functionLabel} not found among the listed rpc calls. `);
  }
  var theArguments = {};
  var functionFrontend = this.theFunctions[functionLabel];
  if (functionFrontend === null || functionFrontend === undefined) {
    return theArguments;
  }
  var currentInputs = functionFrontend.inputs;
  for (var inputLabel in currentInputs) {
    var inputId = currentInputs[inputLabel];
    var rawInput = document.getElementById(inputId).value;
    theArguments[inputLabel] = this.convertToCorrectType(functionLabel, inputLabel, rawInput);
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

var optionsForKanbanGOStandard = {};
FabNode.prototype.callbackStandard = function(functionLabel, input, output) {
  jsonToHtml.writeJSONtoDOMComponent(input, output, optionsForKanbanGOStandard);
}


FabNode.prototype.run = function(functionLabel) {
  var theArguments = this.getArguments(functionLabel);
  var messageBody = fabRPCSpec.getPOSTBodyFromRPCLabel(functionLabel, theArguments);
  var theURL = `${pathnames.url.known.fabcoin.rpc}`;
  var currentResult = ids.defaults.fabcoin.outputFabcoinBlockInfo;
  var currentProgress = globals.spanProgress();
  var callbackCurrent = this.callbackStandard;
  var functionFrontend = this.theFunctions[functionLabel];
  if (functionFrontend !== undefined) {
    if (functionFrontend.callback !== undefined && functionFrontend.callback !== null) {
      callbackCurrent = functionFrontend.callback;
    }  
  }
  callbackCurrent = callbackCurrent.bind(this, functionLabel);
  theURL += `?${fabRPCSpec.urlStrings.command}=${messageBody}`;
  submitRequests.submitGET({
    url: theURL,
    progress: currentProgress,
    callback: callbackCurrent,
    result: currentResult
  });

  console.log("Here I am");
}

var fabNode = new FabNode();

module.exports = {
  fabNode
}