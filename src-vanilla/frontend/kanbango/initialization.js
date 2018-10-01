"use strict";

const kanbanGoInitializationRPC = require('../../external_connections/kanbango/initialization');
const kanbanGo = require('../../external_connections/kanbango/rpc');
const ids = require('../ids_dom_elements');
const jsonToHtml = require("../json_to_html");
const pathnames = require("../../pathnames");
const globals = require('../globals');
const submitRequests = require('../submit_requests');

function KanbanGONode() {
  /**@type {string} */
  this.idDOM = "";
  /**@type {string} */
  this.idBackend = "";
  /**@type {number} */
  this.RPCPort = - 1;
  /**@type {number} */
  this.port = - 1;
  /**@type {string} */
  this.myEnodeAddress = "";
  /**@type {boolean} */
  this.flagSelected = false; 
}

KanbanGONode.prototype.init = function (inputData) {
  this.idBackend = String(inputData.id);
  this.RPCPort = inputData.id;
  this.port = inputData.port;
  this.myEnodeAddress = inputData.myEnodeAddress;
  this.idDOM = `kanbanGoNodeSelector_${inputData.id}`;
}

KanbanGONode.prototype.toHTMLRadioButton = function() {
  var result = "";
  result += `&nbsp;&nbsp;&nbsp;`;
  result += `<label class = "containerRadioButton">`;
  result += `<input type = "radio" name = "rpcKanbanGO" id = "${this.idDOM}" `;
  result += ` onchange = "window.kanban.kanbanGO.initialization.initializer.selectRadio('${this.idBackend}')" `; 
  if (this.flagSelected) {
    result += "checked";
  }
  result += `>`;
  result += `<span class = "radioMark"></span>`;
  result += `node ${this.idBackend}`;
  result += `</label>`;
  return result;
}

function KanbanGoInitializer() {
  this.idOutput = ids.defaults.outputFabcoinInitialization;
  var inputInitialization = ids.defaults.kanbanGO.inputInitialization;
  var rpcCalls = kanbanGoInitializationRPC.rpcCalls;
  this.theFunctions = {
    runNodes: {
      rpcCall: rpcCalls.runNodes.rpcCall,
      inputs: {
        numberOfNodes: inputInitialization.numberOfNodes
      }
    },
    getNodeInformation: {
      rpcCall: rpcCalls.getNodeInformation.rpcCall,
      callback: this.getNodeInformationCallback
    }
  };
  /**@type {KanbanGONode[]} */
  this.nodes = [];
  /**@type {string} */
  this.selectedNode = "";
}

KanbanGoInitializer.prototype.getNodeInformation = function () {
  initializer.run('getNodeInformation');
}

KanbanGoInitializer.prototype.selectRadio = function (idRadio) {
  this.selectedNode = idRadio;
  //console.log(`DEBUG: set this.selectedNode to: ${idRadio} `);
}

KanbanGoInitializer.prototype.toHTMLRadioButton = function () {
  var radioButtonHTML = "";
  radioButtonHTML += `<label class = "containerRadioButton">`;
  radioButtonHTML += `<input type = "radio" name = "rpcKanbanGO" id = "kanbanGoNodeSelector_all" `;
  radioButtonHTML += ` onchange = "window.kanban.kanbanGO.initialization.initializer.selectRadio('all')" `; 
  if (this.selectedNode === "all") {
    radioButtonHTML += "checked";
  }
  radioButtonHTML += `>`;
  radioButtonHTML += `<span class = "radioMark"></span>`;
  radioButtonHTML += `all`;
  radioButtonHTML += `</label>`;

  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    radioButtonHTML += this.nodes[counterNode].toHTMLRadioButton();
  } 
  return radioButtonHTML;
}

KanbanGoInitializer.prototype.getNodeInformationCallback = function (functionLabel, input, output) {
  //console.log("DEBUG: Got back:" + input);
  try {
    var inputParsed = JSON.parse(input);
    this.nodes = [];
    if (this.selectedNode === "") {
      this.selectedNode = "all";
    }
    for (var counterNode = 0; counterNode < inputParsed.length; counterNode ++) {
      var currentNode = new KanbanGONode();
      currentNode.init(inputParsed[counterNode]);
      //console.log("DEBUG: This selected node: " + this.selectedNode + " id backend:  " + currentNode.idBackend);
      if (this.selectedNode === currentNode.idBackend) {
        //console.log("DEbug: selecting node: " + currentNode.idBackend);
        currentNode.flagSelected = true;
      }
      this.nodes.push(currentNode);
    } 
  } catch (e) {
    console.log(`Error while updating node information panel. ${e}`);
  }
  var nodePanel = document.getElementById(ids.defaults.kanbanGO.nodePanel);
  nodePanel.innerHTML = this.toHTMLRadioButton();  
}

var optionsForKanbanGOStandard = {};
KanbanGoInitializer.prototype.callbackStandard = function(functionLabel, input, output) {
  jsonToHtml.writeJSONtoDOMComponent(input, output, optionsForKanbanGOStandard);
  this.getNodeInformation();
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
  var currentResult = ids.defaults.kanbanGO.outputKanbanInitialization;
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