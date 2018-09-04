"use strict";

const kanbanGoInitialization = require('../../resources_kanban_go_initialization');
const kanbanGo = require('../../resources_kanban_go');
const ids = require('../ids_dom_elements');
const jsonToHtml = require("../json_to_html");
const pathnames = require("../../pathnames");
const globals = require('../globals');
const submitRequests = require('../submit_requests');

function KanbanGoInitializer() {
  this.idOutput = ids.defaults.outputFabcoinInitialization;
  var inputInitialization = ids.defaults.kanbanGO.inputInitialization;
  this.theFunctions = {
    runNodes: {
      rpcCall: kanbanGoInitialization.rpcCalls.runNodes.rpcCall,
      inputs: {
        numberOfNodes: inputInitialization.numberOfNodes
      }
    }
  };
}

var optionsForKanbanGOStandard = {};

KanbanGoInitializer.prototype.callbackStandard = function(functionLabel, input, output) {
  jsonToHtml.writeJSONtoDOMComponent(input, output, optionsForKanbanGOStandard);
}

KanbanGoInitializer.prototype.run = function(functionLabel) {
  //console.log(`DEBUG: running ${functionLabel}. `);
  var functionFrontend = this.theFunctions[functionLabel]
  var theArguments = {};

  var currentInputs = functionFrontend.inputs;
  for (var inputLabel in currentInputs) {
    theArguments[inputLabel] = document.getElementById(currentInputs[inputLabel]).value;
  }
  var currentInputsBase64 = functionFrontend.inputsBase64;
  if (currentInputsBase64 !== null && currentInputsBase64 !== undefined) {
    for (var inputLabel in currentInputsBase64) {
      var theValue =  document.getElementById(currentInputsBase64[inputLabel]).value;
      theArguments[inputLabel] = Buffer.from(theValue).toString('base64');
    }
  }
  var messageBody = kanbanGo.getPOSTBodyFromKanbanGORPCLabel(functionFrontend.rpcCall, theArguments);
  var theURL = `${pathnames.url.known.kanbanInitialization}`;
  var currentResult = ids.defaults.kanbanGO.outputInitialization;
  var currentProgress = globals.spanProgress();
  var usePOST = window.kanban.rpc.forceRPCPOST;
  if (!usePOST) {
    if (messageBody.length > 1000) {
      usePOST = true;
    }
  }
  var callbackCurrent = this.callbackStandard;
  if (functionFrontend.callback !== undefined && functionFrontend.callback !== null) {
    callbackCurrent = functionFrontend.callback;
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

var initializer = new KanbanGoInitializer();

module.exports = {
  initializer
}