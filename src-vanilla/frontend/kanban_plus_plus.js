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

function getAddressInputValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputAddressDefault).value;
}

function getPrivateKeyInputValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputPrivateKeyDefault).value;
}

function callbackDumpPrivateKey(input, output) {
  submitRequests.updateInnerHtml(ids.defaults.kanbanPlusPlus.inputPrivateKeyDefault, miscellaneous.removeQuotes(input));
}

function callbackPublicKeyFromPrivate(input, output) {
  submitRequests.updateInnerHtml(ids.defaults.kanbanPlusPlus.inputPublicKeyDefault, miscellaneous.removeQuotes(input));
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
    result : ids.defaults.outputKanbanPlusPlusGeneral,
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
    result : ids.defaults.outputKanbanPlusPlusGeneral,
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
  testPublicKeyFromPrivate
}