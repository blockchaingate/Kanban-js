"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
const globals = require('./globals');
const TransactionBuilder = require('../bitcoinjs_src/transaction_builder');
const ECKey = require('../bitcoinjs_src/ecpair');
const Block = require('../bitcoinjs_src/block');
const jsonic = require('jsonic');
const miscellaneous = require('../miscellaneous');
const encodingBasic = require('../encodings_basic');
const rpcGeneral = require('./fabcoin_rpc_general');

function callbackStandardSendReceive(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function callbackTransactionFetch(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
  try {
    var parsed = JSON.parse(input);
    if (parsed.hex !== undefined && parsed.hex !== null) {
      submitRequests.updateInnerHtml(ids.defaults.inputSendInputRawTransaction, parsed.hex);
    }
    if (parsed.txid !== undefined && parsed.txid !== null) {
      submitRequests.updateInnerHtml(ids.defaults.inputSendTransactionId, parsed.txid);
    }
  } catch (e) {
    console.log(`Error while interpreting transaction. ${e}`);
  }
}

function getOutputSendReceiveRadio() {
  return document.getElementById(ids.defaults.outputSendReceiveRadio);
}

function getOutputSendReceiveButtons() {
  return document.getElementById(ids.defaults.outputSendReceiveButtons);
}

function getOutputTXInfoDivButtons() {
  return document.getElementById(ids.defaults.outputTransactionsButtons);
}

function getAddressInputValue() {
  return document.getElementById(ids.defaults.inputSendAddress).value;
}

function getAmountForSending() {
  return parseInt(document.getElementById(ids.defaults.inputSendAmount).value);
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

function getBlockHash() {
  return document.getElementById(ids.defaults.inputBlockHash);
}

function getBestBlockIndex() {
  return document.getElementById(ids.defaults.inputBestBlockIndex);
}

function getTransactionRawInput() {
  return document.getElementById(ids.defaults.inputSendInputRawTransaction).value;
}

function getTransactionIdToSend() {
  return document.getElementById(ids.defaults.inputSendTransactionId).value;
}

function listAccounts() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.listAccounts.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
    }),
    progress: globals.spanProgress(),
    result : getOutputSendReceiveRadio(),
    callback: callbackStandardSendReceive
  });  
}

function getReceivedByAddress() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.listReceivedByAddress.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
    }),
    progress: globals.spanProgress(),
    result : getOutputSendReceiveRadio(),
    callback: callbackStandardSendReceive
  });  
}

function callbackDumpPrivateKey(input, output){
  submitRequests.updateInnerHtml(ids.defaults.inputSendPrivateKey, input);
  updateOmniFromInputs();
}

function dumpPrivateKey() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.dumpPrivateKey.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
      address: getAddressInputValue()
    }),
    progress: globals.spanProgress(),
    result : document.getElementById(ids.defaults.inputSendPrivateKey),
    callback: callbackDumpPrivateKey
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
    callback: callbackStandardSendReceive
  });  
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
  "amount": ids.defaults.inputSendAmount,
  "txid": ids.defaults.inputSendTransactionId,
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
  submitRequests.updateInnerHtml(ids.defaults.inputOmniForSending, resultString);
  updateComposedRawTransactionFromOmni();
}

function generate1kTransactions() {
  document.getElementById(ids.defaults.checkboxSyncronizeOmni).checked = false;
  (new TransactionTester()).generate1kTransactions();
  console.log("Got to here");
}

function TransactionTester() {
  this.timeStartSigning = null;
  this.progressStringTXadd = "";
  this.transactionId = getTransactionIdToSend();
  this.address = getAddressInputValue();
  this.amountTotal = getAmountForSending();
  this.amountInEachOutputLargeTX = 0;
  this.amountInEachOutputSmallTX = 0;
  this.numOutputs = 1000;
  this.progressAdd = new miscellaneous.SpeedReport ({
    name: "Add outputs",
    total: this.numOutputs
  });
  this.progressSign = new miscellaneous.SpeedReport({
    name: "Sign transactions",
    timeStart: null,
    total: this.numOutputs
  });
  this.resultString = "";
  this.callbackLargeTransactionGenerated = null;
  this.theNetwork = globals.mainPage().getCurrentTransactionProtocolLabel();
  this.transactionLarge = new TransactionBuilder(this.theNetwork);
  this.tranactionsSmall = [];
  this.voutIndex = getSendIndexValueOut();
  this.thePrivateKeyString = getPrivateKey();
  this.theKey = ECKey.fromWIF(this.thePrivateKeyString, this.theNetwork);
}

TransactionTester.prototype.generate1kTransactions = function() {
  this.callbackLargeTransactionGenerated = this.generate1kTransactionsPart2.bind(this);
  this.generateTX1kOutputs();
}

TransactionTester.prototype.generate1kTransactionsPart2 = function () {
  this.progressSign.timeStart = (new Date()).getTime();
  this.tranactionsSmall = Array.prototype.fill(null,0, this.numOutputs);
  this.amountInEachOutputLargeTX = this.amountInEachOutputSmallTX - 100;
  if (this.amountInEachOutputLargeTX < 1) {
    this.amountInEachOutputLargeTX = 100;
  }
  for (var counterSign = 0; counterSign < this.numOutputs; counterSign ++) {
    setTimeout(this.generate1kTransactionsSignOneTransaction.bind(this, counterSign), 0);
  }
}

TransactionTester.prototype.generate1kTransactionsSignOneTransaction = function (indexTransaction) {
  this.tranactionsSmall[indexTransaction] = new TransactionBuilder(this.theNetwork);
  var currentInId = this.transactionLarge.tx.getId();
  this.tranactionsSmall[indexTransaction].addInput(currentInId, indexTransaction);
  this.tranactionsSmall[indexTransaction].addOutput(this.address, this.amountInEachOutputLargeTX);
  this.tranactionsSmall[indexTransaction].sign(0, this.theKey);
  this.progressSign.soFarProcessed ++;
  if (this.progressSign.soFarProcessed % 10 === 0) {
    this.progressSign.timeProgress = (new Date()).getTime();
    document.getElementById(ids.defaults.outputSendReceiveButtons).innerHTML = this.toStringProgress();
  }
}

TransactionTester.prototype.toStringProgress = function () {
  var result = "";
  result += this.progressAdd.toString();
  if (this.progressSign.timeStart !== null) {
    result+= `<br>${this.progressSign.toString()}`;
  }
  result += `<br>${this.resultString}`;
  return result;
}

TransactionTester.prototype.generateTX1kOutputsPart3 = function() {
  this.transactionLarge.sign(0, this.theKey);
  document.getElementById(ids.defaults.inputSendComposedRawTransaction).value = this.transactionLarge.tx.toHex();
  if (this.callbackLargeTransactionGenerated !== null && this.callbackLargeTransactionGenerated !== undefined) {
    this.callbackLargeTransactionGenerated();
  }
}

TransactionTester.prototype.generateTX1kOutputsPart2 = function (outputIndex) {
  this.progressAdd.soFarProcessed ++;
  this.transactionLarge.addOutput(this.address, this.amountInEachOutputLargeTX);
  if (this.progressAdd.soFarProcessed % 10 === 0) {
    this.progressAdd.timeProgress = (new Date()).getTime();
    document.getElementById(ids.defaults.outputSendReceiveButtons).innerHTML = this.toStringProgress();
  }
  if (this.progressAdd.soFarProcessed === this.numOutputs) {
    this.generateTX1kOutputsPart3();
  }
}

TransactionTester.prototype.generateTX1kOutputs = function() {
  document.getElementById(ids.defaults.checkboxSyncronizeOmni).checked = false;
  this.amountInEachOutputLargeTX = (this.amountTotal - 200) / this.numOutputs;
  this.resultString += `About to compose a transaction with <b>${this.numOutputs}</b> outputs worth <b>${this.amountInEachOutputLargeTX}</b> lius each. `;
  this.resultString += `<br>Sender's private key: <b>${this.thePrivateKeyString}</b>.`;
  this.resultString += `<br>All <b>${this.numOutputs}</b> outputs are sent to a single beneficiary: <b>${this.address}</b>.`;
  document.getElementById(ids.defaults.outputSendReceiveButtons).innerHTML = this.resultString;
  this.transactionLarge.addInput(this.transactionId, this.voutIndex);
  for (var counterTransaction = 0; counterTransaction < this.numOutputs; counterTransaction ++) {
    setTimeout(this.generateTX1kOutputsPart2.bind(this, counterTransaction), 0);
  }
}

function generateTX1kOutputs() {
  (new TransactionTester()).generateTX1kOutputs();
}

function hasEmptyValue(id) {
  return document.getElementById(id).value === null || document.getElementById(id).value === "";
}

function updateComposedRawTransactionFromOmni() {
  if ( 
    hasEmptyValue(ids.defaults.inputSendTransactionId) ||
    hasEmptyValue(ids.defaults.inputSendIndexValueOut) ||
    hasEmptyValue(ids.defaults.inputSendAmount) ||
    hasEmptyValue(ids.defaults.inputSendPrivateKey) ||
    hasEmptyValue(ids.defaults.inputSendAddress)
  ) {
    return;
  }
  var theOmni = document.getElementById(ids.defaults.inputOmniForSending);
  try {
    submitRequests.updateInnerHtml(ids.defaults.inputSendComposedRawTransaction, buildSendTransaction().tx.toHex());
  } catch (e) {
    console.log(e);
  }
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
      submitRequests.updateInnerHtml(pairsToUpdateLabelToId[label], parsed[label]);
    }
    updateComposedRawTransactionFromOmni();
    if (!isGood) {
      theOmni.classList.add("inputOmniWithError");
    } else {
      theOmni.classList.remove("inputOmniWithError");
    }
  } catch (e) {
    console.log("Debug: Error:" + e);
  }
}

function interpretTransaction() {
  var rawTransaction = getTransactionRawInput().trim();
  var transactionId = getTransactionIdToSend().trim();
  if (transactionId === null || transactionId === "" && rawTransaction.length > 0) {
    return decodeRawTransaction(rawTransaction);
  }
  if (transactionId.length > 0) {
    submitRequests.updateInnerHtml(ids.defaults.inputSendComposedRawTransaction, "");
    return getTransaction(transactionId);
  }
}

function decodeRawTransaction(rawTransactionHexEncoded) {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.decodeRawTransaction.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
      rawTransaction: rawTransactionHexEncoded
    }),
    progress: globals.spanProgress(),
    result : getOutputTXInfoDivButtons(),
    callback: callbackTransactionFetch
  }); 
}

function getTransaction(txidHexEncodedString) {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getTransaction.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
      txid: txidHexEncodedString
    }),
    progress: globals.spanProgress(),
    result : getOutputTXInfoDivButtons(),
    callback: callbackTransactionFetch
  }); 
}

function getTXoutSetInfo() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getTXOutSetInfo.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
    }),
    progress: globals.spanProgress(),
    result : getOutputSendReceiveRadio(),
    callback: callbackStandardSendReceive
  });  
}

function getTXout() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getTXOut.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
    }),
    progress: globals.spanProgress(),
    result : getOutputSendReceiveRadio(),
    callback: callbackStandardSendReceive
  });  
}

function getListUnspent() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.listUnspent.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
    }),
    progress: globals.spanProgress(),
    result : getOutputSendReceiveRadio(),
    callback: callbackStandardSendReceive
  });  
}

function listTransactions() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.listTransactions.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption()//,
//      count: getNumberOfTransactions()
    }),
    progress: globals.spanProgress(),
    result : getOutputSendReceiveRadio(),
    callback: callbackStandardSendReceive
  });  
}

function callbackGetBlock(inputHex, outputComponent) {
  if (globals.mainPage().pages.send.verbosity === "0") {
    var theBlock = Block.fromHex(inputHex);
    jsonToHtml.writeJSONtoDOMComponent(theBlock.toHumanReadableHex(), outputComponent);
  } else {
    jsonToHtml.writeJSONtoDOMComponent(inputHex, outputComponent);
    try {
      var parsedBlock = JSON.parse(inputHex);
      if (parsedBlock.height !== undefined && parsedBlock.height !== null) {
        submitRequests.updateInnerHtml(ids.defaults.inputBestBlockIndex, parsedBlock.height);
      }
    } catch (e) {
      console.log(`Error parsing block. ${e}.`);
    }
  }
}

function getBlock() {
  globals.mainPage().pages.send.verbosity = "0";
  if (document.getElementById(ids.defaults.checkboxBlockVerbose).checked) {
    globals.mainPage().pages.send.verbosity = "1";  
  }
  document.getElementById(ids.defaults.radioButtonsSend.blockInfo).checked = true;
  var theURL = pathnames.getURLfromRPCLabel(
    pathnames.rpcCalls.getBlock.rpcCall, {
      blockHash: getBlockHash().value, 
      verbosity: globals.mainPage().pages.send.verbosity,
      net: globals.mainPage().getRPCNetworkOption(),
    }
  );
  submitRequests.submitGET({
    url: theURL,
    progress: globals.spanProgress(),
    result : getOutputSendReceiveRadio(),
    callback: callbackGetBlock
  });
}

function getBestBlockHashCallback(inputHex, outputComponent) {
  submitRequests.updateInnerHtml(ids.defaults.inputBlockHash, inputHex);
  jsonToHtml.writeJSONtoDOMComponent(inputHex, outputComponent);
}

function getBestBlockHash() {
  document.getElementById(ids.defaults.radioButtonsSend.bestBlock).checked = true;
  var index = getBestBlockIndex().value;
  var theURL = "";
  if (index === null || index === undefined || index === "") {
    theURL = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getBestBlockHash.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption()
    });
  } else {
    theURL = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getBlockHash.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
      index: index
    });
  }
  submitRequests.submitGET({
    url: theURL,
    progress: globals.spanProgress(),
    result : getOutputSendReceiveRadio(),
    callback: getBestBlockHashCallback
  });
}

function updateSendReceivePage() {
  rpcGeneral.updatePageFromRadioButtonsByName("rpcSend");
}

module.exports = {
  getBlock,
  getBestBlockHash,
  getTXoutSetInfo,
  getTXout,
  getListUnspent,
  listTransactions,
  getTransaction,
  interpretTransaction,
  generateTX1kOutputs,
  generate1kTransactions,
  updateOmniFromInputs,
  updateInputsFromOmni,
  updateSendReceivePage,
  getReceivedByAddress, 
  listAccounts,
  getAccountAddress,
  sendTxidToAddress,
  dumpPrivateKey
}