"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
//const Block = require('../bitcoinjs_src/block');
const globals = require('./globals');

function updateNetworkPage() {
  var theRadioButtons = document.getElementsByName("rpcCallNetwork");
  for (var counterRadio = 0; counterRadio < theRadioButtons.length; counterRadio ++) {
    var currentRadio = theRadioButtons[counterRadio];
    if (currentRadio.checked) {
      var event = new Event("change");
      currentRadio.dispatchEvent(event);
      return;
    }
  }
}

function getNetworkInfoCallBack(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}


function getPeerInfo() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getPeerInfo.rpcCall, {
      net: globals.mainPage().currentNet
    }),
    progress: globals.spanProgress(),
    result : ids.defaults.outputRPCNetwork,
    callback: getNetworkInfoCallBack
  });
}

function getNetworkInfo() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getNetworkInfo.rpcCall, {
      net: globals.mainPage().currentNet
    }),
    progress: globals.spanProgress(),
    result : ids.defaults.outputRPCNetwork,
    callback: getNetworkInfoCallBack
  });
}

function getNetTotals() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getNetTotals.rpcCall, {
      net: globals.mainPage().currentNet
    }),
    progress: globals.spanProgress(),
    result : ids.defaults.outputRPCNetwork,
    callback: getNetworkInfoCallBack
  });
}

module.exports = {
  getPeerInfo, 
  getNetworkInfo,
  getNetTotals,
  updateNetworkPage
}