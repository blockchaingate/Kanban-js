"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
//const Block = require('../bitcoinjs_src/block');
const globals = require('./globals');
const miscellaneous = require('../miscellaneous');
const chartJS = require('chart.js');

function callbackKanbanPlusPlusGeneralStandard(input, output){
  jsonToHtml.writeJSONtoDOMComponent(input, output, {});
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

function setNet(netName) {
  var thePage = globals.mainPage();
  thePage.currentKanbanNetworkName = netName;
  thePage.storePageSettings(); 
  var radioId = thePage.fabcoinNetworkRadioIds[netName];
  document.getElementById(radioId).checked = true;
  updateKanbanPlusPlus();
}

function setMainNet() {
  setNet(pathnames.networkDataKanban.mainNetKanban.name);
}

function setTestKanban() {
  setNet(pathnames.networkDataKanban.testKanban.name);
}

module.exports = {
  updateKanbanPlusPlus,
  getReceivedByAddress,
  setTestKanban,
  setMainNet
}