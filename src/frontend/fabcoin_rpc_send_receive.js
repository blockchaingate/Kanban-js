"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
const globals = require('./globals');
const RPCGeneral = require('./fabcoin_rpc_general');

function sendReceiveCallbackStandard(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function getOutputSendReceiveRadio() {
  return document.getElementById(ids.defaults.outputSendReceiveRadio);
}

function getOutputSendReceiveButtons() {
  return document.getElementById(ids.defaults.outputSendReceiveButtons);
}

function getReceivedByAddress() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.listReceivedByAddress.rpcCall, {
      net: globals.mainPage().currentNet,
    }),
    progress: globals.spanProgress(),
    result : getOutputSendReceiveRadio(),
    callback: sendReceiveCallbackStandard
  });  
}

function dumpPrivateKey() {
  var theAddress = document.getElementById(ids.defaults.inputAddressWhoseKeyToDump).value;
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.dumpPrivateKey.rpcCall, {
      net: globals.mainPage().currentNet,
      address: theAddress
    }),
    progress: globals.spanProgress(),
    result : getOutputSendReceiveButtons(),
    callback: sendReceiveCallbackStandard
  });  
}

function updateSendReceivePage() {
  getReceivedByAddress();
}

module.exports = {
  updateSendReceivePage,
  getReceivedByAddress, 
  dumpPrivateKey
}