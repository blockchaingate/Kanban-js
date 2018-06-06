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
    network: true
  };
  if (currentLabel in pagesToUpdate) {
    var currentPage = globals.mainPage().pages[currentLabel];
    if (currentPage.updateFunction !== null) {
      currentPage.updateFunction();
    }
  }
}

function setTestNet() {
  globals.mainPage().currentNet = "-testnet";
  updatePages();
}

function setMainNet() {
  globals.mainPage().currentNet = "-mainnet";
  updatePages();
}

function setRegtest() {
  globals.mainPage().currentNet = "-regtest";
  updatePages();
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

function listUnspentCallback(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function getListUnspent() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.listUnspent.rpcCall, {
      net: globals.getPage().currentNet,
    }),
    progress: globals.spanProgress(),
    result : getOutputTXInfoDiv(),
    callback: listUnspentCallback
  });  
}

module.exports = {
  setTestNet,
  setMainNet,
  setRegtest,
  getReceivedByAccount,
  getListUnspent,
  listAccounts,
}