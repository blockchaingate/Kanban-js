"use strict";
const submitRequests = require('./../submit_requests');
const pathnames = require('../../pathnames');
const ids = require('./../ids_dom_elements');
const jsonToHtml = require('./../json_to_html');
//const Block = require('../bitcoinjs_src/block');
const globals = require('./../globals');
const RPCGeneral = require('./fabcoin_rpc_general');


function updateNetworkPage() {
  RPCGeneral.updatePageFromRadioButtonsByName(ids.defaults.radioGroups.rpcCallNetwork);
}

function callbackGetNetworkInfo(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent, {});
}

function getPeerInfo() {
  var theURL = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getPeerInfo.rpcCall, {
    net: globals.mainPage().getRPCNetworkOption()
  });
  submitRequests.submitGET({
    url: theURL,
    progress: globals.spanProgress(),
    result : ids.defaults.outputRPCNetwork,
    callback: callbackGetNetworkInfo
  });
}

function getNetworkInfo() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getNetworkInfo.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption()
    }),
    progress: globals.spanProgress(),
    result : ids.defaults.outputRPCNetwork,
    callback: callbackGetNetworkInfo
  });
}

function getNetTotals() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getNetTotals.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption()
    }),
    progress: globals.spanProgress(),
    result : ids.defaults.outputRPCNetwork,
    callback: callbackGetNetworkInfo
  });
}

module.exports = {
  getPeerInfo, 
  getNetworkInfo,
  getNetTotals,
  updateNetworkPage
}