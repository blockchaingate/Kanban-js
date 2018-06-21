"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
const globals = require('./globals');
const RPCGeneral = require('./fabcoin_rpc_general');

function callbackProfilingStandard(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent, {});
}

function getOutputProfilingStandard() {
  return document.getElementById(ids.defaults.outputProfiling);
}

function getMemoryInfo() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getMemoryInfo.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
    }),
    progress: globals.spanProgress(),
    result : getOutputProfilingStandard(),
    callback: callbackProfilingStandard
  });  
}

function updateProfilingPage() {
  RPCGeneral.updatePageFromRadioButtonsByName(ids.defaults.radioGroups.rpcProfiling);

}

module.exports = {
  updateProfilingPage,
  getMemoryInfo,
}