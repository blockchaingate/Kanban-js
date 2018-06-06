"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
const Block = require('../bitcoinjs_src/block');
const globals = require('./globals');

function getTXoutSetInfoCallback(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function getTXoutSetInfo(){
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getTXOutSetInfo.rpcCall, {
      net: globals.getPage().currentNet,
    }),
    progress: getSpanProgress(),
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
      net: globals.getPage().currentNet,
    }),
    progress: getSpanProgress(),
    result : getOutputTXInfoDiv(),
    callback: getTXoutCallback
  });  
}

function getOutputTXInfoDiv() {
  return document.getElementById(ids.defaults.outputRPCTXInfo);
}

function updateTXInfoPage() {
  if (document.getElementById(ids.defaults.radioButtonTransactionsListUnspent).checked === true) {
    getListUnspent();
  } else {
    getTXoutSetInfo();
  }
}

module.exports = {
  getTXoutSetInfo,
  getTXout
}