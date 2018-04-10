"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
const Block = require('../bitcoinjs_src/block');

function getPage(){
  return window.kanban.thePage;
}

function getBlockHash(){
  return document.getElementById(ids.defaults.inputBlockHash);
}

function getSpanProgress(){ 
  return document.getElementById(ids.defaults.progressReport);
}

function getOutputDiv(){
  return document.getElementById(ids.defaults.rpcOutput);
}

function updatePage(){
  if (getPage().pages.blockInfo.updateFunction === getBlock){
    document.getElementById(ids.defaults.radioButtonBestBlock).checked = true;
    getBestBlockHash();
  } else {
    getPage().pages.blockInfo.updateFunction();
  }
}

function setTestNet(){
  getPage().pages.blockInfo.currentNet = "-testnet";
  updatePage();
}

function setMainNet(){
  getPage().pages.blockInfo.currentNet = "";
  updatePage();
}

function getBlockCallback(inputHex, outputComponent){
  var theBlock = Block.fromHex(inputHex);
  jsonToHtml.writeJSONtoDOMComponent(theBlock.toHumanReadableHex(), outputComponent);
  getPage().pages.blockInfo.updateFunction = getBlock;
}
function getBlock(){
  var theURL = pathnames.getURLfromRPCLabel(
    pathnames.rpcCalls.getBlock.rpcCallLabel, {
      blockHash: getBlockHash().value, 
      verbosity: "0",
      net: getPage().pages.blockInfo.currentNet,
    }
  );
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputDiv(),
    callback: getBlockCallback
  });
}

function getPeerInfoCallBack(input, outputComponent){
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
  getPage().pages.blockInfo.updateFunction = getPeerInfo;  
}
function getPeerInfo(){
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getPeerInfo.rpcCallLabel, {
      net: getPage().pages.blockInfo.currentNet,
    }),
    progress: getSpanProgress(),
    result : getOutputDiv(),
    callback: getPeerInfoCallBack
  });
}

function getBestBlockHashCallback(inputHex, outputComponent){
  getBlockHash().value = inputHex;
  jsonToHtml.writeJSONtoDOMComponent(inputHex, outputComponent);
  getPage().pages.blockInfo.updateFunction = getBestBlockHash;  
}
function getBestBlockHash(){
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getBestBlockHash.rpcCallLabel,{
      net: getPage().pages.blockInfo.currentNet,
    }),
    progress: getSpanProgress(),
    result : getOutputDiv(),
    callback: getBestBlockHashCallback
  });
}

module.exports = {
  getPeerInfo, 
  getBestBlockHash,
  getBlock,
  setTestNet,
  setMainNet
}