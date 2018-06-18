"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
const globals = require('./globals');
const TransactionBuilder = require('../bitcoinjs_src/transaction_builder');
const ECKey = require('../bitcoinjs_src/ecpair')
const jsonic = require('jsonic');

function sendReceiveCallbackStandard(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function getOutputSendReceiveRadio() {
  return document.getElementById(ids.defaults.outputSendReceiveRadio);
}

function getOutputSendReceiveButtons() {
  return document.getElementById(ids.defaults.outputSendReceiveButtons);
}

function getAddressInputValue() {
  return document.getElementById(ids.defaults.inputSendAddress).value;
}

function getAccountInputValue() {
  return document.getElementById(ids.defaults.inputAccountName).value;
}

function getTransactionIdToSend() {
  return document.getElementById(ids.defaults.inputTransactionIdForSending).value;
}

function getAmountForSending() {
  return parseInt(document.getElementById(ids.defaults.inputAmountForSending).value);
}

function getSendIndexValueOut() {
  return parseInt(document.getElementById(ids.defaults.inputSendIndexValueOut).value);
}

function getPrivateKey() {
  return document.getElementById(ids.defaults.inputSendPrivateKey).value;
}

function getOmniForSending() {
  return document.getElementById(ids.defaults.inputOmniForSending).value;
}

function getBalance() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getBalance.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
      account: getAccountInputValue()
    }),
    progress: globals.spanProgress(),
    result : getOutputSendReceiveRadio(),
    callback: sendReceiveCallbackStandard
  });  
}

function listAccounts() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.listAccounts.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
    }),
    progress: globals.spanProgress(),
    result : getOutputSendReceiveRadio(),
    callback: sendReceiveCallbackStandard
  });  
}

function getReceivedByAddress() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.listReceivedByAddress.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
    }),
    progress: globals.spanProgress(),
    result : getOutputSendReceiveRadio(),
    callback: sendReceiveCallbackStandard
  });  
}

function dumpPrivateKey() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.dumpPrivateKey.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
      address: getAddressInputValue()
    }),
    progress: globals.spanProgress(),
    result : getOutputSendReceiveButtons(),
    callback: sendReceiveCallbackStandard
  });  
}

function getAccountAddress() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getAccountAddress.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
      account: getAccountInputValue()
    }),
    progress: globals.spanProgress(),
    result : getOutputSendReceiveButtons(),
    callback: sendReceiveCallbackStandard
  });  
}

function updateSendReceivePage() {
  getReceivedByAddress();
}

function buildSendTransaction() {
  var transactionId = getTransactionIdToSend();
  var address = getAddressInputValue();
  var amount = getAmountForSending();
  var theNetwork = globals.mainPage().getCurrentTransactionProtocolLabel();
  var theTransaction = new TransactionBuilder(theNetwork);
  var voutIndex = getSendIndexValueOut();
  var thePrivateKeyString = getPrivateKey();
  theTransaction.addInput(transactionId, voutIndex);
  theTransaction.addOutput(address, amount);
  var theKey = ECKey.fromWIF(thePrivateKeyString, theNetwork);
  theTransaction.sign(0, theKey);
  return theTransaction;
}

function sendTxidToAddress() {

  console.log(`Debug: transaction: ${buildSendTransaction().tx.toHex()}`);
}

var pairsToUpdateLabelToId = {
  "address" : ids.defaults.inputSendAddress,
  "privateKey": ids.defaults.inputSendPrivateKey,
  "amount": ids.defaults.inputAmountForSending,
  "txid": ids.defaults.inputTransactionIdForSending,
  "vout": ids.defaults.inputSendIndexValueOut
}

var pairsToUpdateIdsToLabels = {};
for (var label in pairsToUpdateLabelToId) {
  pairsToUpdateIdsToLabels[pairsToUpdateLabelToId[label]] = label; 
}

function updateOmniFromInputs() {
  if (!document.getElementById(ids.defaults.checkboxSyncronizeOmni).checked) {
    return;
  }
  var resultObject = {};
  var numObjects = 0;
  for (var label in pairsToUpdateLabelToId) {
    var currentValue = document.getElementById(pairsToUpdateLabelToId[label]).value.trim();
    if (currentValue !== null && currentValue !== undefined && currentValue !== "") {
      resultObject[label] = currentValue;
      numObjects ++;
    }
  }
  //document.getElementById(ids.defaults.inputOmniForSending).value = JSON.stringify(resultObject);
  var resultString = "";
  var indexCurrent = 0;
  for (label in resultObject) {
    resultString += `${label}: ${resultObject[label]}`;
    if (indexCurrent < numObjects - 1) {
      resultString += ",\n";
    }
    indexCurrent ++;
  }
  document.getElementById(ids.defaults.inputOmniForSending).value = resultString;
}

function generate1kTransactions() {
  document.getElementById(ids.defaults.checkboxSyncronizeOmni).checked = false;
  
  console.log("Got to here");
}

function TransactionTester() {
  this.timeStart = (new Date()).getTime();
  this.timeStartSigning = null;
  this.resultString = "";
  this.progressStringTXadd = "";
  this.transactionId = getTransactionIdToSend();
  this.address = getAddressInputValue();
  this.amountTotal = getAmountForSending();
  this.numOutputs = 1000;
  this.theNetwork = globals.mainPage().getCurrentTransactionProtocolLabel();
  this.numOutputsGenerated = 0;
  this.numOutputsSigned = 0;
  this.theTransaction = new TransactionBuilder(this.theNetwork);
  this.voutIndex = getSendIndexValueOut();
  this.thePrivateKeyString = getPrivateKey();
  this.theKey = ECKey.fromWIF(this.thePrivateKeyString, this.theNetwork);

}

TransactionTester.prototype.toStringProgressTXAdd = function () {
  this.progressStringTXadd = "";
  var elapsedTime = (new Date()).getTime() - this.timeStart;
  var speed = this.numOutputsGenerated / elapsedTime * 1000; 
  this.progressStringTXadd += `Added ${this.numOutputsGenerated} outputs out of ${this.numOutputs} in ${elapsedTime} ms. `;
  this.progressStringTXadd += `<br>Speed: ${speed.toFixed(1)} per second. `;
  return this.progressStringTXadd;
}

TransactionTester.prototype.generateTX1kOutputsPart3 = function(outputIndex) {
  this.theTransaction.sign(outputIndex, this.theKey);
  this.numOutputsSigned ++;
  if (this.numOutputsSigned >= this.numOutputs) {

  }
}

TransactionTester.prototype.generateTX1kOutputsPart2 = function (outputIndex) {
  this.numOutputsGenerated ++;
  this.theTransaction.addOutput(this.address, this.amountInEachOutput);
  if (this.numOutputsGenerated % 10 === 0) {
    document.getElementById(ids.defaults.outputSendReceiveButtons).innerHTML = this.toStringProgress() + "<br>" + this.resultString;
  }
  if (this.numOutputsGenerated === this.numOutputs) {
    for (var counterSigned = 0; counterSigned < this.numOutputs; counterSigned ++) {
      setTimeout(this.generateTX1kOutputsPart3.bind(this, counterSigned), 0);
    }
  }
}

TransactionTester.prototype.generateTX1kOutputs = function() {
  document.getElementById(ids.defaults.checkboxSyncronizeOmni).checked = false;
  this.amountInEachOutput = (this.amountTotal - 200) / this.numOutputs;
  this.resultString += `About compose a transaction with <b>${this.numOutputs}</b> outputs worth <b>${this.amountInEachOutput}</b> lius each. `;
  this.resultString += `<br>Sender's private key: <b>${this.thePrivateKeyString}</b>.`;
  this.resultString += `<br>All <b>${this.numOutputs}</b> outputs are sent to a single beneficiary: <b>${this.address}</b>.`;
  document.getElementById(ids.defaults.outputSendReceiveButtons).innerHTML = this.resultString;
  this.theTransaction.addInput(this.transactionId, this.voutIndex);
  for (var counterTransaction = 0; counterTransaction < this.numOutputs; counterTransaction ++) {
    setTimeout(this.generateTX1kOutputsPart2.bind(this, counterTransaction), 0);
  }
}

function generateTX1kOutputs() {
  (new TransactionTester()).generateTX1kOutputs();
}

function updateInputsFromOmni() {
  if (!document.getElementById(ids.defaults.checkboxSyncronizeOmni).checked) {
    return;
  }
  try {
    var parsed = jsonic(getOmniForSending());
    var isGood = true;
    for (var label in parsed) {
      if (!(label in pairsToUpdateLabelToId)) {
        isGood = false;
        continue;
      }
      if (parsed[label] === undefined || parsed[label] === null) {
        continue;
      }
      document.getElementById(pairsToUpdateLabelToId[label]).value = parsed[label];
    }
    var theOmni = document.getElementById(ids.defaults.inputOmniForSending);
    try {
      document.getElementById(ids.defaults.inputSendRawTransaction).value = buildSendTransaction().tx.toHex();
    } catch (e) {
      isGood = false;
      console.log(e);
    }
    if (!isGood) {
      theOmni.classList.add("inputOmniWithError");
    } else {
      theOmni.classList.remove("inputOmniWithError");
    }
  } catch (e) {
    console.log("Debug: Error:" + e);
  }
}

module.exports = {
  generateTX1kOutputs,
  generate1kTransactions,
  updateOmniFromInputs,
  updateInputsFromOmni,
  updateSendReceivePage,
  getReceivedByAddress, 
  listAccounts,
  getBalance,
  getAccountAddress,
  sendTxidToAddress,
  dumpPrivateKey
}