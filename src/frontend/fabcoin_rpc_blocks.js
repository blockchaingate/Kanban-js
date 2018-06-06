"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
const Block = require('../bitcoinjs_src/block');
const globals = require('./globals');
const RPCGeneral = require('./fabcoin_rpc_general');

function getBlockHash() {
  return document.getElementById(ids.defaults.inputBlockHash);
}

function getBestBlockIndex() {
  return document.getElementById(ids.defaults.inputBestBlockIndex);
}

function getBlockCallback(inputHex, outputComponent) {
  if (globals.mainPage().pages.blockInfo.verbosity === "0") {
    var theBlock = Block.fromHex(inputHex);
    jsonToHtml.writeJSONtoDOMComponent(theBlock.toHumanReadableHex(), outputComponent);
  } else {
    jsonToHtml.writeJSONtoDOMComponent(inputHex, outputComponent);
  }
}

function getBlock() {
  globals.mainPage().pages.blockInfo.verbosity = "0";
  if (document.getElementById(ids.defaults.checkboxBlockVerbose).checked) {
    globals.mainPage().pages.blockInfo.verbosity = "1";  
  }
  document.getElementById(ids.defaults.radioButtonBlockInfo).checked = true;
  var theURL = pathnames.getURLfromRPCLabel(
    pathnames.rpcCalls.getBlock.rpcCall, {
      blockHash: getBlockHash().value, 
      verbosity: globals.mainPage().pages.blockInfo.verbosity,
      net: globals.mainPage().currentNet,
    }
  );
  submitRequests.submitGET({
    url: theURL,
    progress: globals.spanProgress(),
    result : ids.defaults.outputRPCBlockInfo,
    callback: getBlockCallback
  });
}

function getBestBlockHashCallback(inputHex, outputComponent) {
  getBlockHash().value = inputHex;
  jsonToHtml.writeJSONtoDOMComponent(inputHex, outputComponent);
}

function getBestBlockHash() {
  var index = getBestBlockIndex().value;  
  var theURL = "";
  if (index === null || index === undefined || index === "") {
    theURL = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getBestBlockHash.rpcCall, {
      net: globals.mainPage().currentNet
    });
  } else {
    theURL = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getBlockHash.rpcCall, {
      net: globals.mainPage().currentNet,
      index: index
    });
  }
  submitRequests.submitGET({
    url: theURL,
    progress: globals.spanProgress(),
    result : ids.defaults.outputRPCBlockInfo,
    callback: getBestBlockHashCallback
  });
}

function updateBlockInfoPage() {
  RPCGeneral.updatePageFromRadioButtonsByName("rpcCallBlockInfo");
}


module.exports = {
  getBestBlockHash,
  getBlock,
  updateBlockInfoPage
}