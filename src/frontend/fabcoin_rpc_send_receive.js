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

function getOutputSendReceive() {
  return document.getElementById(ids.defaults.outputSendReceive);
}

function getReceivedByAddress() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.listReceivedByAddress.rpcCall, {
      net: globals.mainPage().currentNet,
    }),
    progress: globals.spanProgress(),
    result : getOutputSendReceive(),
    callback: sendReceiveCallbackStandard
  });  
}

function updateSendReceivePage() {
  console.log("DEBUG: here i am");
  getReceivedByAddress();
}

module.exports = {
  updateSendReceivePage
}