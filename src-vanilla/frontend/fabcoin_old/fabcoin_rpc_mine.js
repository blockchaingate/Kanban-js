"use strict";
const submitRequests = require('./../submit_requests');
const pathnames = require('../../pathnames');
const ids = require('./../ids_dom_elements');
const jsonToHtml = require('./../json_to_html');
const globals = require('./../globals');
const RPCGeneral = require('./fabcoin_rpc_general');
const miscellaneous = require('../../miscellaneous');

function callbackMineStandard(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent, {});
}

function getOutputMiningRadio() {
  return document.getElementById(ids.defaults.outputMineRadio);
}

function getOutputMiningButtons() {
  return document.getElementById(ids.defaults.outputMineButtons);
}

function getMiningInfo() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getMiningInfo.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
    }),
    progress: globals.spanProgress(),
    result : getOutputMiningRadio(),
    callback: callbackMineStandard
  });  
}

function getGenerate() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getGenerate.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
    }),
    progress: globals.spanProgress(),
    result : getOutputMiningRadio(),
    callback: callbackMineStandard
  });  
}

function generateToAddress() {
  var numberOfBlocks = miscellaneous.convertToIntegerIfPossible(document.getElementById(ids.defaults.inputNumberOfBlocks).value);
  var maxTries = miscellaneous.convertToIntegerIfPossible(document.getElementById(ids.defaults.inputMaxNumberOfTries).value);
  var address = document.getElementById(ids.defaults.inputMiningAddress).value;
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.generateToAddress.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
      address: address,
      numberOfBlocks: numberOfBlocks, 
      maxTries: maxTries,  
    }),
    progress: globals.spanProgress(),
    result : getOutputMiningButtons(),
    callback: callbackMineStandard
  });  
}

function updateMiningPage() {
  RPCGeneral.updatePageFromRadioButtonsByName(ids.defaults.radioGroups.rpcMine);
}

module.exports = {
  updateMiningPage,
  getMiningInfo,
  getGenerate,
  generateToAddress
}