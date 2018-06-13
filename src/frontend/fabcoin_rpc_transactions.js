"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
const Block = require('../bitcoinjs_src/block');
const globals = require('./globals');
const RPCGeneral = require('./fabcoin_rpc_general');


function getTXoutSetInfoCallback(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function getTXoutSetInfo() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getTXOutSetInfo.rpcCall, {
      net: globals.mainPage().currentNet,
    }),
    progress: globals.spanProgress(),
    result : getOutputTXInfoDiv(),
    callback: getTXoutSetInfoCallback
  });  
}

function getTXoutCallback(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function getTXout() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getTXOut.rpcCall, {
      net: globals.mainPage().currentNet,
    }),
    progress: globals.spanProgress(),
    result : getOutputTXInfoDiv(),
    callback: getTXoutCallback
  });  
}

function getOutputTXInfoDiv() {
  return document.getElementById(ids.defaults.outputRPCTXInfo);
}

function updateTXInfoPage() {
  RPCGeneral.updatePageFromRadioButtonsByName("rpcCallTxInfo");
}

function listUnspentCallback(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function getListUnspent() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.listUnspent.rpcCall, {
      net: globals.mainPage().currentNet,
    }),
    progress: globals.spanProgress(),
    result : getOutputTXInfoDiv(),
    callback: listUnspentCallback
  });  
}

module.exports = {
  getTXoutSetInfo,
  getTXout,
  getListUnspent,
  updateTXInfoPage
}