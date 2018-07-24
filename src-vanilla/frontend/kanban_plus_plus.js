"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
//const Block = require('../bitcoinjs_src/block');
const globals = require('./globals');
const miscellaneous = require('../miscellaneous');
const miscellaneousFrontEnd = require('./miscellaneous_frontend');

function setAddress(container) {
  submitRequests.updateValue(ids.defaults.kanbanPlusPlus.inputAddressDefault, container.getAttribute("content"));
  submitRequests.updateValue(ids.defaults.kanbanPlusPlus.inputPrivateKeyDefault, "");
}

function setSignature(container) {
  submitRequests.updateValue(ids.defaults.kanbanPlusPlus.inputSignatureDefault, container.getAttribute("content"));
}

function setNonce(container) {
  submitRequests.updateValue(ids.defaults.kanbanPlusPlus.inputNoncesDefault, container.getAttribute("content"));
}

var optionsForKanbanPlusPlusGeneralStandard = {
  transformers: {
    address : {
      handlerName: setAddress.name,
      transformer: miscellaneous.hexShortenerForDisplay
    },
    signatureBase58: {
      handlerName: setSignature.name,
      transformer: miscellaneous.hexShortenerForDisplay
    },
    nonceBase58Check: {
      handlerName: setNonce.name,
      transformer: miscellaneous.hexShortenerForDisplay
    }
  }
}

miscellaneousFrontEnd.attachModuleFullNameToHandlerNames(
  optionsForKanbanPlusPlusGeneralStandard.transformers, 
  "window.kanban.kanbanPlusPlus.general"
);

function callbackKanbanPlusPlusSignatureVerification(input, output){
  jsonToHtml.writeJSONtoDOMComponent(input, output, optionsForKanbanPlusPlusGeneralStandard);
  if (typeof output === "string") {
    output = document.getElementById(output);
  }
  var inputParsed = JSON.parse(input);
  if (inputParsed.result === 1) {
    output.innerHTML = "<b style='color:green'>Verified</b><br>" + output.innerHTML;
  } else {
    output.innerHTML = "<b style='color:red'>Failed</b><br>" + output.innerHTML;
  }
}

function callbackKanbanPlusPlusGeneralStandard(input, output){
  jsonToHtml.writeJSONtoDOMComponent(input, output, optionsForKanbanPlusPlusGeneralStandard);
}

function callbackKanbanPlusPlusGeneralCrypto(input, output){
  jsonToHtml.writeJSONtoDOMComponent(input, output, optionsForKanbanPlusPlusGeneralStandard);
}

function getAddressInputValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputAddressDefault).value;
}

function getPrivateKeyInputValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputPrivateKeyDefault).value;
}

function getPrivateKeysBase64() {
  return Buffer.from(getPrivateKeyInputValue()).toString('base64');
}

function getNoncesBase64() {
  return Buffer.from(getNonceValue()).toString('base64');
}

function getSignatureValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputSignatureDefault).value;
}

function getPublicKeyValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputPublicKeyDefault).value;
}

function getMessageValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputMessageToSha3).value;
}

function getMessageBase64() {
  return Buffer.from(getMessageValue()).toString('base64');
}

function getNonceValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputNoncesDefault).value;
}

function hasEmptyValue(id) {
  return document.getElementById(id).value === null || document.getElementById(id).value === "";
}

function highlightRedIfEmpty(idsToCheck) {
  var isGood = true;
  for (var counterIds = 0; counterIds < idsToCheck.length; counterIds ++) {
    if (hasEmptyValue(idsToCheck[counterIds])) {
      submitRequests.highlightError(idsToCheck[counterIds]);
      isGood = false;
    } else {
      submitRequests.highlightInput(idsToCheck[counterIds]);
    }
  }
  return isGood;
}

function callbackDumpPrivateKey(input, output) {
  submitRequests.updateInnerHtml(ids.defaults.kanbanPlusPlus.inputPrivateKeyDefault, miscellaneous.removeQuotes(input));
}

function callbackPublicKeyFromPrivate(input, output) {
  var result;
  try {
    result = JSON.parse(input).result;
  } catch (e) {
    result = miscellaneous.removeQuotes(input);
  }
  submitRequests.updateInnerHtml(ids.defaults.kanbanPlusPlus.inputPublicKeyDefault, result);
}

function callbackSha3(input, output) {
  submitRequests.updateInnerHtml(ids.defaults.kanbanPlusPlus.inputOutputSha3DigestDefault, miscellaneous.removeQuotes(input));
}

function dumpPrivateKey() {
  highlightRedIfEmpty([
    ids.defaults.kanbanPlusPlus.inputAddressDefault
  ]);
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCallsKanban.dumpPrivateKey.rpcCall, {
      net: globals.mainPage().getRPCKanbanNetworkOption(),
      address: getAddressInputValue()
    }, true),
    progress: globals.spanProgress(),
    result : document.getElementById(ids.defaults.inputSendPrivateKey),
    callback: callbackDumpPrivateKey
  });  
}

function testSha3 () {
  highlightRedIfEmpty([
    ids.defaults.kanbanPlusPlus.inputMessageToSha3
  ]);
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCallsKanban.testSha3.rpcCall, {
      net: globals.mainPage().getRPCKanbanNetworkOption(),
      message: getMessageBase64()
    }, true),
    progress: globals.spanProgress(),
    result : document.getElementById(ids.defaults.inputOutputSha3DigestDefault),
    callback: callbackSha3
  });  
}

function testSchnorrSignatureVerify() {
  highlightRedIfEmpty([
    ids.defaults.kanbanPlusPlus.inputSignatureDefault,
    ids.defaults.kanbanPlusPlus.inputPublicKeyDefault,
    ids.defaults.kanbanPlusPlus.inputMessageToSha3
  ]);
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCallsKanban.testSchnorrSignatureVerify.rpcCall, {
      net: globals.mainPage().getRPCKanbanNetworkOption(),
      signature: getSignatureValue(),
      publicKey: getPublicKeyValue(),
      message: getMessageBase64(),
    }, true),
    progress: globals.spanProgress(),
    result : document.getElementById(ids.defaults.kanbanPlusPlus.outputKanbanPlusPlusSecond),
    callback: callbackKanbanPlusPlusSignatureVerification
  });  
}

function testSchnorrSignature() {
  highlightRedIfEmpty([
    ids.defaults.kanbanPlusPlus.inputPrivateKeyDefault, 
    ids.defaults.kanbanPlusPlus.inputMessageToSha3,
    ids.defaults.kanbanPlusPlus.inputNoncesDefault
  ]);
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCallsKanban.testSchnorrSignature.rpcCall, {
      net: globals.mainPage().getRPCKanbanNetworkOption(),
      privateKey: getPrivateKeyInputValue(),
      message: getMessageBase64(),
      nonce: getNonceValue()
    }, true),
    progress: globals.spanProgress(),
    result : document.getElementById(ids.defaults.kanbanPlusPlus.outputKanbanPlusPlusSecond),
    callback: callbackKanbanPlusPlusGeneralCrypto
  });  
}

function updatePageFromRadioButtonsByName(desiredRadioButtonName) {
  var theRadioButtons = document.getElementsByName(desiredRadioButtonName);
  for (var counterRadioButtons = 0; counterRadioButtons < theRadioButtons.length; counterRadioButtons ++) {
    var currentRadioButton = theRadioButtons[counterRadioButtons];
    if (currentRadioButton.checked) { 
      var event = new Event('change');
      currentRadioButton.dispatchEvent(event);
      return;
    }
  }
}

function updateKanbanPlusPlus() {
  updatePageFromRadioButtonsByName(ids.defaults.radioGroups.kanbanPlusPlusGeneral);
}

function getReceivedByAddress() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCallsKanban.listReceivedByAddress.rpcCall, {
      net: globals.mainPage().getRPCKanbanNetworkOption(),
    }, true),
    progress: globals.spanProgress(),
    result : ids.defaults.kanbanPlusPlus.outputKanbanPlusPlusGeneral,
    callback: callbackKanbanPlusPlusGeneralStandard
  });  
}

function testCommitAggregateSignature() {
  highlightRedIfEmpty([
    ids.defaults.kanbanPlusPlus.inputPrivateKeyDefault,
    ids.defaults.kanbanPlusPlus.inputNoncesDefault
  ]);
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(
      pathnames.rpcCallsKanban.testAggregateSignatureCommitment.rpcCall, {
        net: globals.mainPage().getRPCKanbanNetworkOption(),
        privateKeys: getPrivateKeysBase64(),
        nonces: getNoncesBase64()
      }, 
      true
    ),
    progress: globals.spanProgress(),
    result : ids.defaults.kanbanPlusPlus.outputKanbanPlusPlusSecond,
    callback: callbackKanbanPlusPlusGeneralStandard
  });    
}

function testPublicKeyFromPrivate() {
  highlightRedIfEmpty([ids.defaults.kanbanPlusPlus.inputPrivateKeyDefault]);
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(
      pathnames.rpcCallsKanban.testPublicKeyGeneration.rpcCall, {
        net: globals.mainPage().getRPCKanbanNetworkOption(),
        privateKey: getPrivateKeyInputValue()
      }, 
      true
    ),
    progress: globals.spanProgress(),
    result : ids.defaults.kanbanPlusPlus.outputKanbanPlusPlusGeneral,
    callback: callbackPublicKeyFromPrivate
  });  
}

function setNet(netName) {
  var thePage = globals.mainPage();
  thePage.currentKanbanNetworkName = netName;
  thePage.storePageSettings(); 
  var radioId = thePage.kanbanNetworkRadioIds[netName];
  document.getElementById(radioId).checked = true;
  updateKanbanPlusPlus();
}

function setMainKanban() {
  setNet(pathnames.networkDataKanban.mainKanban.name);
}

function setTestKanban() {
  setNet(pathnames.networkDataKanban.testKanban.name);
}

module.exports = {
  updateKanbanPlusPlus,
  getReceivedByAddress,
  setTestKanban,
  setMainKanban,
  setAddress,
  setNonce,
  setSignature,
  dumpPrivateKey,
  testPublicKeyFromPrivate,
  testSha3,
  testSchnorrSignature,
  testSchnorrSignatureVerify,
  testCommitAggregateSignature
}