"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
const Block = require('../bitcoinjs_src/block');

function getPage(){
  return window.kanban.thePage;
}

function getSpanProgress(){ 
  return document.getElementById(ids.defaults.progressReport);
}

function getOutputTXInfoDiv(){
  return document.getElementById(ids.defaults.rpcOutputTXInfo);
}

function synchronizeUnspentTransactionsCallBack(input, outputComponent){
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}
function synchronizeUnspentTransactions(){
  submitRequests.submitGET({
    url: pathnames.getURLfromNodeCallLabel(pathnames.nodeCalls.computeUnspentTransactions.nodeCallLabel),
    progress: getSpanProgress(),
    result : getOutputTXInfoDiv(),
    callback: synchronizeUnspentTransactionsCallBack
  });
}

module.exports = {
  synchronizeUnspentTransactions
}