const submitRequests = require('../submit_requests');
const jsonToHtml = require('../json_to_html');
var JSONTransformer = jsonToHtml.JSONTransformer;
const kanbanGO = require('../../external_connections/kanbango/rpc');
const globals = require('../globals');
const ids = require('../ids_dom_elements');
require('../brace/mode/solidity');

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

function PendingCall () {
  /**@type {string} */
  this.callType = "";
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
}

PendingCall.prototype.run = function (functionLabel) {
  this.functionLabel = functionLabel;
  for (var currentId in this.nodeCalls) {
    this.runOneId(currentId);
  }
}

PendingCall.prototype.updateFields = function(parsedInput, outputs) {
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
      header += `<b>Error:</b> <span style='color:red'>${parsedInput.error}</span><br>`;
    }
    if (parsedInput.reason !== null && parsedInput.reason !== undefined) {
      header += parsedInput.reason + "<br>";
    }
    if (currentFunction !== null) {
      if (currentFunction.outputs !== null && currentFunction.outputs !== undefined) {
        this.updateFields(parsedInput, currentFunction.outputs);
      }
    }
  } catch (e) {
    header = `<b>Error:</b> ${e}<br>`;
  }
  resultHTML = header + resultHTML;
  return resultHTML;
}

PendingCall.prototype.callbackRunNodes = function(nodeId, input, output) {
  this.callbackStandard(nodeId, input, output);
  this.owner.getNodeInformation();
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
  submitRequests.updateValue(ids.defaults.kanbanGO.inputAggregateSignature.solutions, solutions.join(", "));
}

PendingCall.prototype.callbackAggregateInitialization = function(nodeId, input, output) {
  this.callbackStandard(nodeId, input, output);
  var privateKeys = getSignerField(input, "privateKeyBase58");
  var publicKeys = getSignerField(input, "myPublicKey");
  submitRequests.updateValue(ids.defaults.kanbanGO.inputAggregateSignature.privateKeys, privateKeys.join(", "));
  submitRequests.updateValue(ids.defaults.kanbanGO.inputAggregateSignature.publicKeys, publicKeys.join(", "));
}

PendingCall.prototype.callbackAggregateCommitment = function(nodeId, input, output) {
  this.callbackStandard(nodeId, input, output);
  var commitments = getSignerField(input, "commitmentHexCompressed");
  var nonces = getSignerField(input, "myNonceBase58");
  submitRequests.updateValue(ids.defaults.kanbanGO.inputAggregateSignature.commitments, commitments.join(", "));
  submitRequests.updateValue(ids.defaults.kanbanGO.inputAggregateSignature.nonces, nonces.join(", "));
}

PendingCall.prototype.callbackCompileSolidity = function (nodeId, input, output) {
  console.log(input);
  try {
    var parsedInput = JSON.parse(input)
    submitRequests.updateValue(ids.defaults.kanbanGO.inputInitialization.contractABI, JSON.stringify(parsedInput.ABI));
    console.log(input);
  } catch(e) { 
    submitRequests.updateInnerHtml(ids.defaults.kanbanGO.inputInitialization.contractABI, "Failed to parse ABI. ");
  }
  this.callbackStandard(nodeId, input, output);
}

PendingCall.prototype.callbackFetchSmartContract = function (nodeId, input, output) {
  this.callbackStandard(nodeId, input, output);
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
    this.flagShowClearButton = false;
  }
  if (typeof output === "string") {
    output = document.getElementById(output);
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
    return domElement.value;
  }
  if (domElement.tagName === "TEXTAREA") {
    return domElement.value;
  }
}

PendingCall.prototype.runOneId = function (nodeId) {
  var theFunction = this.owner.theFunctions[this.functionLabel];
  this.callTypeSpec = this.owner.callTypes[this.callType];
  theRPCCalls = this.callTypeSpec.rpcCalls;
  if (theFunction === null || theFunction === undefined) {
    if (this.functionLabel in theRPCCalls) {
      theFunction = null;
    } else {
      throw (`Unknown function call label: ${this.functionLabel}`);
    }
  }
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
  var theRPCCall = this.functionLabel;
  if (theFunction !== null) {
    if (theFunction.rpcCall !== null && theFunction.rpcCall !== undefined) {
      theRPCCall = theFunction.rpcCall;
    }
  } 

  var messageBody = `command=${getPOSTBodyFromKanbanRPCLabel(theRPCCall, theArguments)}`;
  var nodeObject = {
    id: nodeId
  };
  messageBody += `&node=${escape(JSON.stringify(nodeObject))}`;

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
  callbackCurrent = callbackCurrent.bind(this, nodeId);
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