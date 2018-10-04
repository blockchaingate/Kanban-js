"use strict";
const submitRequests = require('./../submit_requests');
const pathnames = require('../../pathnames');
const ids = require('./../ids_dom_elements');
const jsonToHtml = require('./../json_to_html');
const globals = require('./../globals');
const TransactionBuilder = require('../../bitcoinjs_src/transaction_builder');
const ECKey = require('../../bitcoinjs_src/ecpair');
const Block = require('../../bitcoinjs_src/block');
const jsonic = require('jsonic');
const miscellaneous = require('../../miscellaneous');
const miscellaneousFrontEnd = require('./../miscellaneous_frontend');
const rpcGeneral = require('./fabcoin_rpc_general');
const bigInteger = require('big-integer');

function setAddress(container) {
  submitRequests.updateValue(ids.defaults.inputSendAddress, container.getAttribute("content"));
  submitRequests.updateValue(ids.defaults.inputSendPrivateKey, "");
  updateOmniFromInputs();
}

function setTransactionId(container) {
  submitRequests.updateValue(ids.defaults.inputSendTransactionId, container.getAttribute("content"));
  submitRequests.updateValue(ids.defaults.inputSendInputRawTransaction, "");
  updateOmniFromInputs(); 
}

function revealLongNoParent(container) {
  console.log(container);
}

function revealLongWithParent(container) {
  if (container.nextElementSibling === null) {
    var parent = container.parentNode;
    var newSpan = document.createElement("span");
    newSpan.innerHTML = "<br>" + container.getAttribute("content");
    parent.insertBefore(newSpan, container.nextElementSibling);
  } else  {
    container.nextElementSibling.remove();
  }

}

function setNothing() {

}

function setBlockHash(container) {
  submitRequests.updateValue(ids.defaults.inputBlockHash, container.getAttribute("content"));
  getBlock();
}

function setValueFromContainer(container) {
  var inputValue = container.getAttribute("content");
  var inputVout = container.getAttribute("grandParentLabel");
  setValue(inputValue, inputVout, false);
}

function setValue(inputValue, inputVout, dontUpdateOmni) {
  var valueInLius = bigInteger(inputValue * 100000000).toString();
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
      handlerName: setAddress.name,
      transformer: miscellaneous.hexShortenerForDisplay
    },
    tx: {
      handlerName: setTransactionId.name,
      transformer: miscellaneous.hexShortenerForDisplay
    },
    txid: {
      handlerName: setTransactionId.name,
      transformer: miscellaneous.hexShortenerForDisplay
    },
    txids: {
      parentLabels: {
        "$number" : {
          handlerName: setTransactionId.name,
          transformer: miscellaneous.hexShortenerForDisplay
        }
      }
    },
    details: {
      parentLabels: {
        address : {
          handlerName: setAddress.name,
          transformer: miscellaneous.hexShortenerForDisplay
        }
      }
    },
    blockhash: {
      handlerName: setBlockHash.name,
      transformer: miscellaneous.hexShortenerForDisplay
    },
    previousBlock: {
      handlerName: setBlockHash.name,
      transformer: miscellaneous.hexShortenerForDisplay
    },
    previousblockhash: {
      handlerName: setBlockHash.name,
      transformer: miscellaneous.hexShortenerForDisplay
    },
    nextblockhash: {
      handlerName: setBlockHash.name,
      transformer: miscellaneous.hexShortenerForDisplay
    },
    hash: {
      handlerName: setBlockHash.name,
      transformer: miscellaneous.hexShortenerForDisplay
    },
    vin: {
      parentLabels: {
        asm: {
          handlerName: revealLongWithParent.name,
          transformer: miscellaneous.hexShortenerForDisplay
        }, 
        hex: {
          handlerName: revealLongWithParent.name,
          transformer: miscellaneous.hexShortenerForDisplay
        }
      }
    },
    hex: {
      handlerName: revealLongNoParent.name,
      transformer: miscellaneous.hexShortenerForDisplay
    },
    vout: {
      parentLabels: {
        value: {
          handlerName: setValueFromContainer.name
        },
        "$number": {
          handlerName: setAddress.name,
          transformer: miscellaneous.hexShortenerForDisplay
        }
      }
    }
  }
}

miscellaneousFrontEnd.attachModuleFullNameToHandlerNames(optionsForStandardSendReceive.transformers, "window.kanban.rpc.sendReceive");

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

function getOutputSendBulkButtons() {
  return document.getElementById(ids.defaults.outputSendReceiveBulkOutputButtons);
}

function getAddressInputValue() {
  return document.getElementById(ids.defaults.inputSendAddress).value;
}

function getAmountBeforeFees() {
  return parseInt(document.getElementById(ids.defaults.inputSendAmount).value);
}

function getAmountAfterFees() {
  return getAmountBeforeFees() - getFeeInteger();
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

function getFeeString() {
  return document.getElementById(ids.defaults.inputSendFee).value;
}

function getFeeInteger() {
  return parseInt(getFeeString());
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
  submitRequests.updateInnerHtml(ids.defaults.inputSendPrivateKey, miscellaneous.removeQuotes(input));
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
  var amount = getAmountAfterFees();
  var theNetwork = globals.mainPage().getCurrentTransactionProtocolLabel();
  var theTransaction = new TransactionBuilder(theNetwork);
  var voutIndex = getSendIndexValueOut();
  var thePrivateKeyString = getPrivateKey();
  theTransaction.addInput(transactionId, voutIndex);
  theTransaction.addOutput(address, amount);
  var theKey = ECKey.fromWIF(thePrivateKeyString, theNetwork);
  try {
    var output = theTransaction.sign(0, theKey);
    console.log(output);
  } catch (e) {
    console.log(`Error signing transaction ${e}.`);
  }
  return theTransaction;
}

function sendRawBulkTransactions() {
  var rawTransactionsHexEncodedString = `[${document.getElementById(ids.defaults.inputSendRawBulkTransaction).value}]`;
  var rawTransactions = jsonic(rawTransactionsHexEncodedString);
  if (!Array.isArray(rawTransactions)) {
    rawTransactions = [rawTransactions];
  }
  var messageBody = pathnames.getPOSTBodyfromRPCLabel(pathnames.rpcCalls.sendBulkRawTransactions.rpcCall, {
    net: globals.mainPage().getRPCNetworkOption(),
    rawTransactions: rawTransactions.join(",")
  });
  submitRequests.submitPOST({
    url: pathnames.url.known.fabcoinOldRPC,
    messageBody: messageBody,
    progress: globals.spanProgress(),
    result : getOutputSendBulkButtons(),
    callback: callbackSendTransaction
  }); 
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
}

function TransactionTester() {
  if (!this.hasNonEmptyInputs()) {
    return;
  }
  this.timeStartSigning = null;
  this.progressStringTXadd = "";
  this.transactionId = getTransactionIdToSend();
  this.address = getAddressInputValue();
  this.amountTotal = getAmountBeforeFees();
  this.amountInEachOutputLargeTX = 0;
  this.amountInEachOutputSmallTX = 0;
  this.numOutputs = 1000;
  this.feeSmallTX = getFeeInteger();
  if (this.numOutputs < 20) {
    this.feeLargeTX = this.feeSmallTX;
  } else {
    this.feeLargeTX = Math.floor(this.feeSmallTX * this.numOutputs / 20);
  }
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
  this.transactionBuilderLarge = new TransactionBuilder(this.theNetwork);
  this.transactionLarge = null;
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
  this.amountInEachOutputSmallTX = this.amountInEachOutputLargeTX - this.feeSmallTX;
  if (this.amountInEachOutputSmallTX < 1) {
    this.amountInEachOutputSmallTX = 100;
  }
  for (var counterSign = 0; counterSign < this.numOutputs; counterSign ++) {
    setTimeout(this.generate1kTransactionsSignOneTransaction.bind(this, counterSign), 0);
  }
}

TransactionTester.prototype.generate1kTransactionsSignOneTransaction = function (indexTransaction) {
  var transactionBuilder = new TransactionBuilder(this.theNetwork);
  var currentInId = this.transactionLarge.getId();
  transactionBuilder.addInput(currentInId, indexTransaction);
  transactionBuilder.addOutput(this.address, this.amountInEachOutputSmallTX);
  transactionBuilder.sign(0, this.theKey);
  this.transactionsSmall[indexTransaction] = transactionBuilder.build(); 
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
  hexList[0] = this.transactionLarge.toHex();
  for (var counterTransactions = 0; counterTransactions < this.transactionsSmall.length; counterTransactions ++) {
    hexList[counterTransactions + 1] = this.transactionsSmall[counterTransactions].toHex();
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
  this.transactionBuilderLarge.sign(0, this.theKey);
  this.transactionLarge = this.transactionBuilderLarge.build();
  submitRequests.updateValue(ids.defaults.inputSendRawBulkTransaction, this.transactionLarge.toHex());
  //console.log(`Generated tx with id: ${this.transactionLarge.getId()} and hash: ${this.transactionLarge.toHex()}`);
  if (this.callbackLargeTransactionGenerated !== null && this.callbackLargeTransactionGenerated !== undefined) {
    this.callbackLargeTransactionGenerated();
  }
}

TransactionTester.prototype.generateTX1kOutputsPart2 = function (outputIndex) {
  this.progressAdd.soFarProcessed ++;
  this.transactionBuilderLarge.addOutput(this.address, this.amountInEachOutputLargeTX);
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
  this.resultString += `About to compose a transaction with input amount: <b>${this.amountTotal}</b>, fee: ${this.feeLargeTX} and <b>${this.numOutputs}</b> outputs worth <b>${this.amountInEachOutputLargeTX}</b> lius each. `;
  this.resultString += `<br>Sender's private key: <b>${this.thePrivateKeyString}</b>.`;
  this.resultString += `<br>All <b>${this.numOutputs}</b> outputs are sent to a single beneficiary: <b>${this.address}</b>.`;
  document.getElementById(ids.defaults.outputSendReceiveButtons).innerHTML = this.resultString;
  this.transactionBuilderLarge.addInput(this.transactionId, this.voutIndex);
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
    submitRequests.updateValue(ids.defaults.inputSendRawNonBulkTransaction, theTransaction.build().toHex());
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
  inputHex = miscellaneous.removeQuotes(inputHex);
  if (globals.mainPage().pages.send.verbosity === 0) {
    var theBlock;
    try {
      theBlock = Block.fromHex(inputHex);
      jsonToHtml.writeJSONtoDOMComponent(theBlock.toHumanReadableHex(), outputComponent, optionsForStandardSendReceive);
    } catch (e) {
      theBlock = `Error parsing block: ${inputHex}. `;
      jsonToHtml.writeJSONtoDOMComponent(theBlock, outputComponent, optionsForStandardSendReceive);
    }
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
  //var forceRPC = window.kanban.rpc[pathnames.forceRPCPOST];
  globals.mainPage().pages.send.verbosity = 0;
  if (document.getElementById(ids.defaults.checkboxBlockVerbose).checked) {
    globals.mainPage().pages.send.verbosity = 1;// forceRPC ? "1" : "1";  
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
  inputHex = miscellaneous.removeQuotes(inputHex);
  submitRequests.updateInnerHtml(ids.defaults.inputBlockHash, inputHex);
  jsonToHtml.writeJSONtoDOMComponent(inputHex, outputComponent, optionsForStandardSendReceive);
}

function getBestBlockHash() {
  document.getElementById(ids.defaults.radioButtonsSend.bestBlock).checked = true;
  var index = miscellaneous.convertToIntegerIfPossible(getBestBlockIndex().value);
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
  rpcGeneral.updatePageFromRadioButtonsByName(ids.defaults.radioGroups.rpcSend);
}

module.exports = {
  setAddress, 
  setTransactionId,
  setBlockHash,
  setValueFromContainer,
  setNothing,
  revealLongWithParent,
  revealLongNoParent,
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
  sendRawBulkTransactions,
  dumpPrivateKey
}