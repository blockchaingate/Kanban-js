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

var optionsForKanbanPlusPlusGeneralStandard = {
  transformers: {
    address : {
      handlerName: setAddress.name,
      transformer: miscellaneous.hexShortenerForDisplay
    }
  }
}

miscellaneousFrontEnd.attachModuleFullNameToHandlerNames(
  optionsForKanbanPlusPlusGeneralStandard.transformers, 
  "window.kanban.kanbanPlusPlus.general"
);

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

function getMessageValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputMessageToSha3).value;
}

function getNonceValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputNoncesDefault).value;
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
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCallsKanban.testSha3.rpcCall, {
      net: globals.mainPage().getRPCKanbanNetworkOption(),
      message: getMessageValue()
    }, true),
    progress: globals.spanProgress(),
    result : document.getElementById(ids.defaults.inputOutputSha3DigestDefault),
    callback: callbackSha3
  });  
}

function testSchnorrSignature() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCallsKanban.testSchnorrSignature.rpcCall, {
      net: globals.mainPage().getRPCKanbanNetworkOption(),
      privateKey: getPrivateKeyInputValue(),
      message: getMessageValue(),
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

function testPublicKeyFromPrivate() {
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
  dumpPrivateKey,
  testPublicKeyFromPrivate,
  testSha3,
  testSchnorrSignature
}