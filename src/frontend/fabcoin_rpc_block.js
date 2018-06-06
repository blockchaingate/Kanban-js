"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
const Block = require('../bitcoinjs_src/block');
const globals = require('./globals');

function getBlockHash() {
  return document.getElementById(ids.defaults.inputBlockHash);
}

function getBestBlockIndex() {
  return document.getElementById(ids.defaults.inputBestBlockIndex);
}

function getBlockCallback(inputHex, outputComponent) {
  if (getPage().pages.blockInfo.verbosity === "0") {
    var theBlock = Block.fromHex(inputHex);
    jsonToHtml.writeJSONtoDOMComponent(theBlock.toHumanReadableHex(), outputComponent);
    getPage().pages.blockInfo.updateFunction = getBlock;
  } else {
    jsonToHtml.writeJSONtoDOMComponent(inputHex, outputComponent);
  }
}
function getBlock() {
  getPage().pages.blockInfo.verbosity = "0";
  if (document.getElementById(ids.defaults.checkboxBlockVerbose).checked) {
    getPage().pages.blockInfo.verbosity = "1";  
  }
  document.getElementById(ids.defaults.radioButtonBlockInfo).checked = true;
  var theURL = pathnames.getURLfromRPCLabel(
    pathnames.rpcCalls.getBlock.rpcCall, {
      blockHash: getBlockHash().value, 
      verbosity: getPage().pages.blockInfo.verbosity,
      net: globals.getPage().currentNet,
    }
  );
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputBlockInfoDiv(),
    callback: getBlockCallback
  });
}

function getBestBlockHashCallback(inputHex, outputComponent) {
  getBlockHash().value = inputHex;
  jsonToHtml.writeJSONtoDOMComponent(inputHex, outputComponent);
  getPage().pages.blockInfo.updateFunction = getBestBlockHash;  
}

function getBestBlockHash() {
  var index = getBestBlockIndex().value;  
  var theURL = "";
  if (index === null || index === undefined || index === "") {
    theURL = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getBestBlockHash.rpcCall, {
      net: globals.getPage().currentNet
    });
  } else {
    theURL = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getBlockHash.rpcCall, {
      net: globals.getPage().currentNet,
      index: index
    });
  }
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputBlockInfoDiv(),
    callback: getBestBlockHashCallback
  });
}

function updateBlockInfoPage() {
  if (getPage().pages.blockInfo.updateFunction === getBlock) {
    document.getElementById(ids.defaults.radioButtonBestBlock).checked = true;
    getBestBlockHash();
  } else {
    getPage().pages.blockInfo.updateFunction();
  }
}


module.exports = {
  getBestBlockHash,
  getBlock
}