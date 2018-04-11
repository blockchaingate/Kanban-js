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

function getBestBlockIndex(){
  return document.getElementById(ids.defaults.inputBestBlockIndex);
}

function getSpanProgress(){ 
  return document.getElementById(ids.defaults.progressReport);
}

function getOutputBlockInfoDiv(){
  return document.getElementById(ids.defaults.rpcOutputBlockInfo);
}

function getOutputTXInfoDiv(){
  return document.getElementById(ids.defaults.rpcOutputTXInfo);
}

function updateBlockInfoPage(){
  if (getPage().pages.blockInfo.updateFunction === getBlock){
    document.getElementById(ids.defaults.radioButtonBestBlock).checked = true;
    getBestBlockHash();
  } else {
    getPage().pages.blockInfo.updateFunction();
  }
}

function updateTXInfoPage(){
  getTXoutSetInfo();
}

function updatePages(){
  var currentPage = getPage().pages[getPage().currentPageLabel]; 
  if (currentPage === getPage().pages.txInfo){
    return updateTXInfoPage();
  }
  if (currentPage === getPage().pages.blockInfo){
    return updateBlockInfoPage();
  }
}

function setTestNet(){
  getPage().pages.blockInfo.currentNet = "-testnet";
  updatePages();
}

function setMainNet(){
  getPage().pages.blockInfo.currentNet = "";
  updatePages();
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
    result : getOutputBlockInfoDiv(),
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
    result : getOutputBlockInfoDiv(),
    callback: getPeerInfoCallBack
  });
}

function getBestBlockHashCallback(inputHex, outputComponent){
  getBlockHash().value = inputHex;
  jsonToHtml.writeJSONtoDOMComponent(inputHex, outputComponent);
  getPage().pages.blockInfo.updateFunction = getBestBlockHash;  
}
function getBestBlockHash(){
  var index = getBestBlockIndex().value;  
  var theURL = "";
  if (index === null || index === undefined || index === ""){
    theURL = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getBestBlockHash.rpcCallLabel,{
      net: getPage().pages.blockInfo.currentNet
    });
  } else {
    theURL = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getBlockHash.rpcCallLabel,{
      net: getPage().pages.blockInfo.currentNet,
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

function getTXoutSetInfoCallback(input, outputComponent){
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}
function getTXoutSetInfo(){
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getTXOutSetInfo.rpcCallLabel, {
      net: getPage().pages.blockInfo.currentNet,
    }),
    progress: getSpanProgress(),
    result : getOutputTXInfoDiv(),
    callback: getTXoutSetInfoCallback
  });  
}

function getTXoutCallback(input, outputComponent){
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}
function getTXout(){
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getTXOut.rpcCallLabel, {
      net: getPage().pages.blockInfo.currentNet,
    }),
    progress: getSpanProgress(),
    result : getOutputTXInfoDiv(),
    callback: getTXoutCallback
  });  
}

function getReceivedByAccountCallback(input, outputComponent){
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}
function getReceivedByAccount(){
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getReceivedByAccount.rpcCallLabel, {
      net: getPage().pages.blockInfo.currentNet,
    }),
    progress: getSpanProgress(),
    result : getOutputTXInfoDiv(),
    callback: getReceivedByAccountCallback
  });  
}

function listAccountsCallback(input, outputComponent){
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}
function listAccounts(){
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.listAccounts.rpcCallLabel, {
      net: getPage().pages.blockInfo.currentNet,
    }),
    progress: getSpanProgress(),
    result : getOutputTXInfoDiv(),
    callback: listAccountsCallback
  });  
}

function listUnspentCallback(input, outputComponent){
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}
function listUnspent(){
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.listUnspent.rpcCallLabel, {
      net: getPage().pages.blockInfo.currentNet,
    }),
    progress: getSpanProgress(),
    result : getOutputTXInfoDiv(),
    callback: listUnspentCallback
  });  
}

module.exports = {
  getPeerInfo, 
  getBestBlockHash,
  getBlock,
  setTestNet,
  setMainNet,
  getTXoutSetInfo,
  getTXout,
  getReceivedByAccount,
  listAccounts,
  listUnspent
}