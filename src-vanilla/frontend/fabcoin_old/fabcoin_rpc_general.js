"use strict";
const submitRequests = require('./../submit_requests');
const pathnames = require('../../pathnames');
const ids = require('./../ids_dom_elements');
const jsonToHtml = require('./../json_to_html');
const Block = require('../../bitcoinjs_src/block');
const globals = require('./../globals');

function getOutputBlockInfoDiv() {
  return document.getElementById(ids.defaults.outputRPCBlockInfo);
}

function updatePages() {
  var currentLabel = globals.mainPage().currentPageLabel;
  var pagesToUpdate = {
    network: true,
    fabcoinInitialization: true,
    send: true,
    myNodes: true,
    mine: true,
    profiling: true
  };
  if (currentLabel in pagesToUpdate) {
    var currentPage = globals.mainPage().pages[currentLabel];
    if (currentPage.updateFunction !== null) {
      currentPage.updateFunction();
    }
  }
}

function setNet(netName) {
  var thePage = globals.mainPage();
  thePage.currentNetworkName = netName;
  thePage.storePageSettings(); 
  var radioId = thePage.fabcoinNetworkRadioIds[netName];
  document.getElementById(radioId).checked = true;
  updatePages();
}

function setTestNetNoDNS() {
  setNet(pathnames.networkData.testNetNoDNS.name);
}

function setTestNet() {
  setNet(pathnames.networkData.testNet.name);
}

function setMainNet() {
  setNet(pathnames.networkData.mainNet.name);
}

function setRegtest() {
  setNet(pathnames.networkData.regtest.name);
}

function setForcePOST() {
  window.kanban.rpc.forceRPCPOST = document.getElementById(ids.defaults.checkboxForcePOST).checked;
  updatePages();
}

function listAccountsCallback(input, outputComponent) {
  var transformer = new jsonToHtml.JSONTransformer();
  transformer.writeJSONtoDOMComponent(input, outputComponent, {});
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

module.exports = {
  setForcePOST,
  setRegtest,
  setTestNetNoDNS,
  setTestNet,
  setMainNet,
  updatePageFromRadioButtonsByName
}