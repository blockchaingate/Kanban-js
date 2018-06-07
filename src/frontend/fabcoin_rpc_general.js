"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
const Block = require('../bitcoinjs_src/block');
const globals = require('./globals');

function getOutputBlockInfoDiv() {
  return document.getElementById(ids.defaults.outputRPCBlockInfo);
}

function updatePages() {
  var currentLabel = globals.mainPage().currentPageLabel;
  var pagesToUpdate = {
    txInfo: true,
    blockInfo: true,
    network: true,
    fabcoinInitialization: true
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
  thePage.currentNet = netName;
  thePage.storePageSettings(); 
  var currentNet = thePage.getCurrentNetwork();
  document.getElementById(currentNet.radioBoxId).checked = true;
  updatePages();
}

function setTestNet() {
  setNet("-testnet");
}

function setMainNet() {
  setNet("-mainnet");
}

function setRegtest() {
  setNet("-regtest");
}

function getReceivedByAccountCallback(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function getReceivedByAccount() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getReceivedByAccount.rpcCall, {
      net: globals.mainPage().pages.blockInfo.currentNet,
    }),
    progress: globals.spanProgress(),
    result : getOutputTXInfoDiv(),
    callback: getReceivedByAccountCallback
  });  
}

function listAccountsCallback(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function listAccounts() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.listAccounts.rpcCall, {
      net: globals.getPage().currentNet,
    }),
    progress: globals.spanProgress(),
    result : getOutputTXInfoDiv(),
    callback: listAccountsCallback
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

module.exports = {
  setTestNet,
  setMainNet,
  setRegtest,
  getReceivedByAccount,
  listAccounts,
  updatePageFromRadioButtonsByName
}