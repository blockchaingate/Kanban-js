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

function getInfo() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getInfo.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
    }),
    progress: globals.spanProgress(),
    result : getOutputProfilingStandard(),
    callback: callbackProfilingStandard
  });  
}

function getPerformanceProfile() {
  var urlForPOST = pathnames.url.known.rpc;
  var messageBodyForPOST = pathnames.getPOSTBodyfromRPCLabel(pathnames.rpcCalls.getPerformanceProfile.rpcCall, {
    net: globals.mainPage().getRPCNetworkOption()
  });
  submitRequests.submitPOST({
    url: urlForPOST,
    messageBody: messageBodyForPOST,
    progress: globals.spanProgress(),
    result : getOutputProfilingStandard(),
    callback: callbackProfilingStandard
  });  

  //var urlForGET = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getPerformanceProfile.rpcCall, {
  //  net: globals.mainPage().getRPCNetworkOption(),
  //});
  
  //submitRequests.submitGET({
  //  url: urlForGET,
  //  progress: globals.spanProgress(),
  //  result : getOutputProfilingStandard(),
  //  callback: callbackProfilingStandard
  //});  
}

function updateProfilingPage() {
  RPCGeneral.updatePageFromRadioButtonsByName(ids.defaults.radioGroups.rpcProfiling);

}

module.exports = {
  updateProfilingPage,
  getMemoryInfo,
  getInfo,
  getPerformanceProfile
}