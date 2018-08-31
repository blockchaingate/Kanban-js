"use strict";

const KanbanGo = require('../../resources_kanban_go_initialization');
const ids = require('../ids_dom_elements');
const pathnames = require('../../pathnames');

function KanbanGoInitializer() {
  this.idOutput = ids.defaults.outputFabcoinInitialization;
}

KanbanGoInitializer.prototype.run = function(functionLabel) {
  console.log(`DEBUG: running ${functionLabel}. `);
  var theFunction = KanbanGo.rpcCalls[functionLabel];  
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
  var theURL = `${pathnames.url.known.kanbanInitialization}`;
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

var initializer = new KanbanGoInitializer();

module.exports = {
  initializer
}