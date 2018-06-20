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
const bigInteger = require('big-integer');

function setAddress(input) {
  submitRequests.updateValue(ids.defaults.inputSendAddress, input);
  submitRequests.updateValue(ids.defaults.inputSendPrivateKey, "");
  updateOmniFromInputs();
}

function setTransactionId(input) {
  submitRequests.updateValue(ids.defaults.inputSendTransactionId, input);
  submitRequests.updateValue(ids.defaults.inputSendInputRawTransaction, "");
  updateOmniFromInputs(); 
}

function hexShortenerForDisplay(input){
  return `${input.substr(0, 4)}...${input.substr(input.length - 4, 4)}`;
}

function setBlockHash(input) {
  submitRequests.updateValue(ids.defaults.inputBlockHash, input);
  getBlock();
}

function setValue(inputValue, inputVout, dontUpdateOmni) {
  var valueInLius = bigInteger(inputValue).times(100000000).toString();
  submitRequests.updateValue(ids.defaults.inputSendAmount, valueInLius);
  submitRequests.updateValue(ids.defaults.inputSendIndexValueOut, inputVout);
  if (dontUpdateOmni) {
    return;
  }
  updateOmniFromInputs();
}

var optionsForStandardSendReceive = {
  transformers: {
    address : {
      name: setAddress.name,
      transformer: hexShortenerForDisplay
    },
    tx: {
      name: setTransactionId.name,
      transformer: hexShortenerForDisplay
    },
    blockhash: {
      name: setBlockHash.name,
      transformer: hexShortenerForDisplay
    },
    previousBlock: {
      name: setBlockHash.name,
      transformer: hexShortenerForDisplay
    },
    previousblockhash: {
      name: setBlockHash.name,
      transformer: hexShortenerForDisplay
    },
    nextblockhash: {
      name: setBlockHash.name,
      transformer: hexShortenerForDisplay
    },
    hash: {
      name: setBlockHash.name,
      transformer: hexShortenerForDisplay
    },
    vout: {
      parentLabel: "value",
      name: setValue.name
    }
  }
}

var moduleFullName = "window.kanban.rpc.sendReceive";
for (var label in optionsForStandardSendReceive.transformers) {
  optionsForStandardSendReceive.transformers[label].name = `${moduleFullName}.${optionsForStandardSendReceive.transformers[label].name}`;
}

function callbackStandardSendReceive(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent, optionsForStandardSendReceive);
}

function callbackTransactionFetch(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent, optionsForStandardSendReceive);
  try {
    var parsed = JSON.parse(input);
    var doUpdateOmni = false;
    if (parsed.hex !== undefined && parsed.hex !== null) {
      submitRequests.updateInnerHtml(ids.defaults.inputSendInputRawTransaction, parsed.hex);
    } 
    if (parsed.txid !== undefined && parsed.txid !== null) {
      submitRequests.updateInnerHtml(ids.defaults.inputSendTransactionId, parsed.txid);
      doUpdateOmni = true;
    }
    var vout = null;
    var value = null;
    try {
      vout = 0;
      value = parsed.vout[vout].value;
    } catch (e) {
      vout = null;
      value = null;
    }
    if (vout !== null) {
      setValue(value, vout, true);
    }
    if (doUpdateOmni) {
      updateOmniFromInputs();
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
  return document.getElementById(ids.defaults.inputSendOmni).value;
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

function getFee() {
  return document.getElementById(ids.defaults.inputSendFee).value;
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

function sendRawBulkTransaction() {
  console.log("DEBUG: sendRawBulkTransaction");
}

function callbackSendTransaction(input, output) {
  jsonToHtml.writeJSONtoDOMComponent(input, output, optionsForStandardSendReceive);
}

function sendTxidToAddress() {
  var rawTransactionHexEncoded = document.getElementById(ids.defaults.inputSendRawNonBulkTransaction).value;
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.sendRawTransaction.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
      rawTransaction: rawTransactionHexEncoded
    }),
    progress: globals.spanProgress(),
    result : getOutputSendReceiveButtons(),
    callback: callbackSendTransaction
  }); 
}

var pairsToUpdateLabelToId = {
  "address" : ids.defaults.inputSendAddress,
  "privateKey": ids.defaults.inputSendPrivateKey,
  "amountBeforeFee": ids.defaults.inputSendAmount,
  "txid": ids.defaults.inputSendTransactionId,
  "vout": ids.defaults.inputSendIndexValueOut,
  "fee": ids.defaults.inputSendFee
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
  //document.getElementById(ids.defaults.inputSendOmni).value = JSON.stringify(resultObject);
  var resultString = "";
  var indexCurrent = 0;
  for (label in resultObject) {
    resultString += `${label}: ${resultObject[label]}`;
    if (indexCurrent < numObjects - 1) {
      resultString += ",\n";
    }
    indexCurrent ++;
  }
  submitRequests.updateValue(ids.defaults.inputSendOmni, resultString);
  updateComposedRawTransactionFromOmni();
}

function generate1kTransactions() {
  (new TransactionTester()).generate1kTransactions();
  console.log("Got to here");
}

function TransactionTester() {
  if (!this.hasNonEmptyInputs()) {
    return;
  }
  this.timeStartSigning = null;
  this.progressStringTXadd = "";
  this.transactionId = getTransactionIdToSend();
  this.address = getAddressInputValue();
  this.amountTotal = getAmountForSending();
  this.amountInEachOutputLargeTX = 0;
  this.amountInEachOutputSmallTX = 0;
  this.numOutputs = 1000;
  this.feeLargeTX = getFee();
  this.feeSmallTX = getFee();
  this.progressAdd = new miscellaneous.SpeedReport({
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
  this.transactionsSmall = [];
  this.voutIndex = getSendIndexValueOut();
  this.thePrivateKeyString = getPrivateKey();
  this.theKey = ECKey.fromWIF(this.thePrivateKeyString, this.theNetwork);
}

TransactionTester.prototype.hasNonEmptyInputs = function() {
  var idsToCheck = {};
  idsToCheck[ids.defaults.inputSendIndexValueOut] = true;
  idsToCheck[ids.defaults.inputSendPrivateKey] = true;
  idsToCheck[ids.defaults.inputSendAmount] = true;
  idsToCheck[ids.defaults.inputSendAddress]  = true;
  idsToCheck[ids.defaults.inputSendTransactionId] = true;
  var isGood = true;
  for (var label in idsToCheck) {
    if (hasEmptyValue(label)) {
      submitRequests.highlightError(label);
      isGood = false;
    }
  }
  return isGood;
}

TransactionTester.prototype.generate1kTransactions = function() {
  if (!this.hasNonEmptyInputs) {
    return;
  }
  this.callbackLargeTransactionGenerated = this.generate1kTransactionsPart2.bind(this);
  this.generateTX1kOutputs();
}

TransactionTester.prototype.generate1kTransactionsPart2 = function () {
  this.progressSign.timeStart = (new Date()).getTime();
  this.transactionsSmall = [];
  this.transactionsSmall.fill(null, 0, this.numOutputs);
  this.amountInEachOutputLargeTX = this.amountInEachOutputSmallTX - this.feeSmallTX;
  if (this.amountInEachOutputLargeTX < 1) {
    this.amountInEachOutputLargeTX = 100;
  }
  for (var counterSign = 0; counterSign < this.numOutputs; counterSign ++) {
    setTimeout(this.generate1kTransactionsSignOneTransaction.bind(this, counterSign), 0);
  }
}

TransactionTester.prototype.generate1kTransactionsSignOneTransaction = function (indexTransaction) {
  this.transactionsSmall[indexTransaction] = new TransactionBuilder(this.theNetwork);
  var currentInId = this.transactionLarge.tx.getId();
  this.transactionsSmall[indexTransaction].addInput(currentInId, indexTransaction);
  this.transactionsSmall[indexTransaction].addOutput(this.address, this.amountInEachOutputLargeTX);
  this.transactionsSmall[indexTransaction].sign(0, this.theKey);
  this.progressSign.soFarProcessed ++;
  if (this.progressSign.soFarProcessed % 10 === 0) {
    this.progressSign.timeProgress = (new Date()).getTime();
    document.getElementById(ids.defaults.outputSendReceiveButtons).innerHTML = this.toStringProgress();
  }
  if (this.progressSign.soFarProcessed >= this.numOutputs) {
    this.generate1kTransactionsFinish();
  }
}

TransactionTester.prototype.generate1kTransactionsFinish = function() {
  var hexList = [];
  hexList.fill(null, 0, this.transactionsSmall.length + 1);
  hexList[0] = this.transactionLarge.tx.toHex();
  for (var counterTransactions = 0; counterTransactions < this.transactionsSmall.length; counterTransactions ++) {
    hexList[counterTransactions + 1] = this.transactionsSmall[counterTransactions].tx.toHex();
  }
  submitRequests.updateValue(ids.defaults.inputSendRawBulkTransaction, `[${hexList.join(", ")}]`);
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
  submitRequests.updateValue(ids.defaults.inputSendRawBulkTransaction, this.transactionLarge.tx.toHex());
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
  if (!this.hasNonEmptyInputs()) {
    return;
  }
  this.amountInEachOutputLargeTX = (this.amountTotal - this.feeLargeTX) / this.numOutputs;
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
  try {
    var theTransaction = buildSendTransaction();
    submitRequests.updateValue(ids.defaults.inputSendRawNonBulkTransaction, theTransaction.tx.toHex());
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
      submitRequests.updateValue(pairsToUpdateLabelToId[label], parsed[label]);
    }
    updateComposedRawTransactionFromOmni();
    var theOmni = document.getElementById(ids.defaults.inputSendOmni);
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
  if (rawTransaction.length > 0) {
    submitRequests.highlightInput(ids.defaults.inputSendInputRawTransaction);
    return decodeRawTransaction(rawTransaction);
  }
  if ((rawTransaction === null || rawTransaction === "") && transactionId.length > 0) {
    submitRequests.highlightInput(ids.defaults.inputSendTransactionId);
    submitRequests.updateValue(ids.defaults.inputSendInputRawTransaction, "");
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
    jsonToHtml.writeJSONtoDOMComponent(theBlock.toHumanReadableHex(), outputComponent, optionsForStandardSendReceive);
  } else {
    jsonToHtml.writeJSONtoDOMComponent(inputHex, outputComponent, optionsForStandardSendReceive);
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

function callbackGetBestBlockHash(inputHex, outputComponent) {
  submitRequests.updateInnerHtml(ids.defaults.inputBlockHash, inputHex);
  jsonToHtml.writeJSONtoDOMComponent(inputHex, outputComponent, optionsForStandardSendReceive);
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
    callback: callbackGetBestBlockHash
  });
}

function updateSendReceivePage() {
  rpcGeneral.updatePageFromRadioButtonsByName("rpcSend");
}

module.exports = {
  setAddress, 
  setTransactionId,
  setBlockHash,
  setValue,
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
  sendRawBulkTransaction,
  dumpPrivateKey
}