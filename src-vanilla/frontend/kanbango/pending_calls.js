"use strict"
const miscellaneousFrontEnd = require('../miscellaneous_frontend');
const submitRequests = require('../submit_requests');
const jsonToHtml = require('../json_to_html');
var JSONTransformer = jsonToHtml.JSONTransformer;
const kanbanGO = require('../../external_connections/kanbango/rpc');
const globals = require('../globals');
const ids = require('../ids_dom_elements');
const storageKanban = require('../storage').storageKanban;
require('../solidity-ace-editor');

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

KanbanGONode.prototype.init = function(inputData) {
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
  result += ` onchange = "window.kanban.kanbanGO.rpc.theKBNodes.selectRadio('${this.idBackend}')" `; 
  if (this.flagSelected) {
    result += "checked";
  }
  result += `>`;
  result += `<span class = "radioMark"></span>`;
  result += `node ${this.idBackend}`;
  result += `</label>`;
  return result;
}

function PendingCall() {
  /**@type boolean */
  this.flagFoundNotStartedError = false;
  /**@type {{jsonOptions: Object, idDefaultOutput: string, rpcCalls: Object, url: string}} */
  this.callTypeSpec = null;
  /** @type {number} */
  this.id = - 1;
  /** @type {number} */
  this.numberReceived = 0;
  /** @type {number} */
  this.totalCalls = 0;
  /** @type {Object} */
  this.nodeCalls = {};
  this.owner = null;
  /** @type {string} */
  this.functionLabel = "";
  /** @type {bool} */
  this.flagShowClearButton = false;
  this.callbackOverridesStandard = null;
}

PendingCall.prototype.run = function(functionLabel) {
  this.functionLabel = functionLabel;
  for (var currentId in this.nodeCalls) {
    this.runOneId(currentId);
  }
}

PendingCall.prototype.updateFields = function(parsedInput, outputs) {
  miscellaneousFrontEnd.updateFieldsRecursively(parsedInput, outputs);
}

PendingCall.prototype.callbackStandardOneCaller = function(
  input, 
  /**@type {JSONTransformer} */ 
  theJSONWriter
) {
  var options = null;
  var currentFunction = this.owner.theFunctions[this.functionLabel];
  if (currentFunction === undefined) {
    currentFunction = null;
  }
  if (currentFunction === null) {
    options = Object.assign({}, this.callTypeSpec.jsonOptions);
  } else if (currentFunction.outputOptions !== null && currentFunction.outputOptions !== undefined) {
    options = Object.assign({}, currentFunction.outputOptions);
  } else {
    options = Object.assign({}, this.callTypeSpec.jsonOptions);
  }

  if (!this.flagShowClearButton) {
    options.flagDontShowClearButton = true;
  }

  var resultHTML = theJSONWriter.getHtmlFromArrayOfObjects(input, options);
  if (input === "") {
    return resultHTML;
  }
  var header = "";
  try {
    var parsedInput = JSON.parse(input);
    
    if (parsedInput.resultHTML !== null && parsedInput.resultHTML !== undefined) {
      header += parsedInput.resultHTML + "<br>"; 
    }
    if (parsedInput.error !== null && parsedInput.error !== undefined) {
      if (parsedInput.error === kanbanGO.urlStrings.errorKanbanNodeStartWasNeverAttempted) {
        this.flagFoundNotStartedError = true;
      }
      header += `<b style = 'color:red'>Error:</b> ${parsedInput.error}<br>`;
    }
    if (parsedInput.reason !== null && parsedInput.reason !== undefined) {
      header += parsedInput.reason + "<br>";
    }
    if (currentFunction !== null) {
      if (currentFunction.outputs !== null && currentFunction.outputs !== undefined) {
        this.updateFields(parsedInput, currentFunction.outputs);
      }
      if (currentFunction.output !== null && currentFunction.output !== undefined) {
        this.updateFields(input, currentFunction.output);
      }
    }
  } catch (e) {
    header = `<b style = 'color:red'>Error:</b> ${e}<br>`;
  }
  resultHTML = header + resultHTML;
  return resultHTML;
}

PendingCall.prototype.callbackRunNodes = function(nodeId, input, output) {
  this.callbackStandard(nodeId, input, output);
  if (typeof output === "string") {
    output = document.getElementById(output);
  }
  var outputRunfabcoind = document.createElement("div");
  output.appendChild(outputRunfabcoind);
  this.getNodeInformationAndRunFabcoind(outputRunfabcoind);
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

PendingCall.prototype.callbackAggregateSolutions = function(nodeId, input, output) {
  this.callbackStandard(nodeId, input, output);
  var solutions = getSignerField(input, "mySolution");
  miscellaneousFrontEnd.updateValue(ids.defaults.kanbanGO.inputAggregateSignature.solutions, solutions.join(", "));
}

PendingCall.prototype.callbackAggregatePrivateKeyGeneration = function(nodeId, input, output) {
  this.callbackStandard(nodeId, input, output);
  var inputParsed = JSON.parse(input);
  var privateKeys = [];
  for (var i = 0; i < inputParsed.privateKeys.length; i ++) {
    privateKeys.push(inputParsed.privateKeys[i]);
  }
  miscellaneousFrontEnd.updateValue(ids.defaults.kanbanGO.inputAggregateSignature.privateKeys, privateKeys.join(", "));
}

PendingCall.prototype.callbackAggregateInitialization = function(nodeId, input, output) {
  this.callbackStandard(nodeId, input, output);
  var privateKeys = getSignerField(input, "privateKeyBase58");
  var publicKeys = getSignerField(input, "myPublicKey");
  miscellaneousFrontEnd.updateValue(ids.defaults.kanbanGO.inputAggregateSignature.privateKeys, privateKeys.join(", "));
  miscellaneousFrontEnd.updateValue(ids.defaults.kanbanGO.inputAggregateSignature.publicKeys, publicKeys.join(", "));
  var publicKeysJoined = `["${publicKeys.join('","')}"]`; 
  miscellaneousFrontEnd.updateValue(ids.defaults.fabcoin.inputBlockInfo.txAggregatePublicKeys, publicKeysJoined);
}

PendingCall.prototype.callbackAggregateCommitment = function(nodeId, input, output) {
  this.callbackStandard(nodeId, input, output);
  var commitments = getSignerField(input, "commitmentHexCompressed");
  var nonces = getSignerField(input, "myNonceBase58");
  miscellaneousFrontEnd.updateValue(ids.defaults.kanbanGO.inputAggregateSignature.commitments, commitments.join(", "));
  miscellaneousFrontEnd.updateValue(ids.defaults.kanbanGO.inputAggregateSignature.nonces, nonces.join(", "));
}

PendingCall.prototype.callbackCompileSolidity = function(nodeId, input, output) {
  //console.log(input);
  try {
    var parsedInput = JSON.parse(input)
    miscellaneousFrontEnd.updateValue(ids.defaults.kanbanGO.inputInitialization.contractABI, JSON.stringify(parsedInput.ABI[0]));
    miscellaneousFrontEnd.updateValue(ids.defaults.fabcoin.inputBlockInfo.contractHex, parsedInput.binaries[0]);
    //console.log(input);
  } catch(e) { 
    miscellaneousFrontEnd.updateInnerHtml(ids.defaults.kanbanGO.inputInitialization.contractABI, "Failed to parse ABI. ");
  }
  this.callbackStandard(nodeId, input, output);
}

PendingCall.prototype.callbackFetchSmartContract = function(nodeId, input, output) {
  this.callbackStandard(nodeId, input, output);
}

var counterCallBackAutostartExtraComponent = 0;

PendingCall.prototype.callbackAutoStartKanbanGO = function(outputComponent, input, output) {
  var theJSONWriter = new JSONTransformer();
  var resultHTML = theJSONWriter.getHtmlFromArrayOfObjects(input, this.owner.optionsInitialization);
  var extraId = `autostartKanbanMoreOutput${counterCallBackAutostartExtraComponent}`;
  resultHTML += `<span id = "${extraId}"></span>`;
  outputComponent.innerHTML += resultHTML;
  theJSONWriter.bindButtons();
  var moreOutput = document.getElementById(extraId);
  this.getNodeInformationAndRunFabcoind(moreOutput);
}

PendingCall.prototype.getNodeInformationAndRunFabcoind = function(outputComponent) {
  if (typeof outputComponent === "string") {
    outputComponent = document.getElementById(outputComponent);
  }
  this.owner.getNodeInformation();
  if (!storageKanban.isTrueVariable(storageKanban.variables.autostartFabcoindAfterKanbanGO)) {
    var newSpan = document.createElement("span");
    newSpan.innerHTML += `<b style="color:red"> Automated fabcoind start off: you may need to start fabcoind manually</b>`;
    outputComponent.appendChild(newSpan);
    return;
  }
  outputComponent.innerHTML += `<b style="color:green"> Will try to run fabcoind for you</b>`;
  var initializer = window.kanban.fabcoin.initialization.initializer; 
  var fabNode = window.kanban.fabcoin.rpc.fabNode;
  var callbackExtra = fabNode.callbackAutoStartFabcoind.bind(fabNode, outputComponent);
  var callStartFabcoind = initializer.run.bind(initializer, 'runFabcoind', callbackExtra);
  setTimeout(callStartFabcoind, 0);
}

PendingCall.prototype.callbackStandard = function(nodeId, input, output) {
  //console.log(`DEBUG: pendingCall id: ${pendingCall.id}, nodeId: ${nodeId}, input: ${input}`);
  this.nodeCalls[nodeId].result = input;
  this.numberReceived ++;
  if (this.numberReceived < this.totalCalls) {
    //console.log("DEBUG: Received some");
    return;
  }
  var resultHTML = "";
  this.flagShowClearButton = true;
  var theJSONWriter = new JSONTransformer();
  for (var currentNodeId in this.nodeCalls) {
    resultHTML += this.callbackStandardOneCaller(this.nodeCalls[currentNodeId].result, theJSONWriter);
    resultHTML += "<br>";
    this.flagShowClearButton = false;
  }
  if (typeof output === "string") {
    output = document.getElementById(output);
  }
  if (this.flagFoundNotStartedError) {
    resultHTML += "<b style='color:green'> Will try to run kanbanGO for you. </b><br>"
    resultHTML += "Equivalent to pressing the 'Run on FAB' button. <br>";
    this.owner.run('runNodesOnFAB', 'initialization', this.callbackAutoStartKanbanGO.bind(this, output));
  }
  output.innerHTML = resultHTML;
  theJSONWriter.bindButtons();
  delete this.owner.pendingCalls[this.id];
}

function getPOSTBodyFromKanbanRPCLabel(theRPCLabel, theArguments) {
  var theRequest = {};
  theRequest[kanbanGO.urlStrings.rpcCallLabel] = theRPCLabel;
  if (theArguments === undefined) {
    theArguments = {};
  }
  for (var label in theArguments) {
    theRequest[label] = theArguments[label];
  }
  return `${encodeURIComponent(JSON.stringify(theRequest))}`;
}

function getValueFromId(/**@type {string}*/ id) {
  if (id === ids.defaults.fabcoin.inputBlockInfo.solidityInput) {
    return window.kanban.ace.editor.getValue();
  }
  var domElement = document.getElementById(id);
  if (domElement === null) {
    return null;
  }
  if (domElement.tagName === "INPUT") {
    if (domElement.type === "checkbox") {
      return domElement.checked;
    }
    return domElement.value;
  }
  if (domElement.tagName === "TEXTAREA") {
    return domElement.value;
  }
}

PendingCall.prototype.getArguments = function(
  theFunction, theRPCCalls
) {
  var theArguments = {};
  var currentInputs = null;
  var currentInputsBase64 = null;
  if (theFunction !== null) {
    currentInputs = theFunction.inputs;
    currentInputsBase64 = theFunction.inputsBase64;
  } else {
    currentInputs = {};
    currentInputsBase64 = {};
  }
  for (var inputLabel in currentInputs) {
    theArguments[inputLabel] = getValueFromId(currentInputs[inputLabel]);
  }
  for (var inputLabel in currentInputsBase64) {
    var theValue = getValueFromId(currentInputsBase64[inputLabel]);
    theArguments[inputLabel] = Buffer.from(theValue).toString('base64');
  }
  var currentSpec = theRPCCalls[this.functionLabel];
  if (currentSpec.mandatoryModifiableArguments !== undefined && currentSpec.mandatoryModifiableArguments !== null) {
    for (var label in currentSpec.mandatoryModifiableArguments) {
      var defaultValue = currentSpec.mandatoryModifiableArguments[label];
      if ((!(label in theArguments)) && defaultValue !== null && defaultValue !== undefined) {
        theArguments[label] = defaultValue;
      }
    }
  }
  return theArguments;
}

PendingCall.prototype.runOneId = function(nodeId) {
  var theFunction = this.owner.theFunctions[this.functionLabel];
  var theRPCCalls = this.callTypeSpec.rpcCalls;
  if (theFunction === null || theFunction === undefined) {
    if (this.functionLabel in theRPCCalls) {
      theFunction = null;
    } else {
      throw (`Unknown function call label: ${this.functionLabel}`);
    }
  }
  var theArguments = this.getArguments(theFunction, theRPCCalls);
  if (theArguments[kanbanGO.urlStrings.serviceLabelReserved] !== undefined) {
    throw (`The argument ${serviceLabelReserved} name is reserved, please use another variable name. `);
  }
  theArguments[kanbanGO.urlStrings.serviceLabelReserved] = {
    type: callType,
    nodeId: nodeId
  };
  var messageBody = `command=${getPOSTBodyFromKanbanRPCLabel(this.functionLabel, theArguments)}`;
  var callType = this.callTypeSpec.callType;
  if (callType === undefined || callType === null) {
    callType = "undefined";
  }
  var theURL = this.callTypeSpec.url;
  var currentResult = this.callTypeSpec.idDefaultOutput;
  if (theFunction !== null) {
    if (theFunction.outputJSON !== undefined && theFunction.outputJSON !== null) {
      currentResult = theFunction.outputJSON;
    }
  }
  var currentProgress = globals.spanProgress();
  var usePOST = window.kanban.rpc.forceRPCPOST;
  if (!usePOST) {
    if (messageBody.length > 1000) {
      usePOST = true;
    }
  }
  var callbackCurrent = this.callbackStandard;
  if (theFunction !== null) {
    if (theFunction.callback !== undefined && theFunction.callback !== null) {
      callbackCurrent = theFunction.callback;
    }  
  }
  if (this.callbackOverridesStandard !== null && this.callbackOverridesStandard !== undefined) {
    callbackCurrent = this.callbackOverridesStandard;
  } else {
    callbackCurrent = callbackCurrent.bind(this, nodeId);
  }
  if (usePOST) {
    submitRequests.submitPOST({
      url: theURL,
      messageBody: messageBody,
      progress: currentProgress,
      callback: callbackCurrent,
      result: currentResult
    });
  } else {
    theURL += `?${messageBody}`;
    submitRequests.submitGET({
      url: theURL,
      progress: currentProgress,
      callback: callbackCurrent,
      result: currentResult
    });
  }
}

module.exports = {
  PendingCall,
  KanbanGONode
}