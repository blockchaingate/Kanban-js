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
  return document.getElementById(ids.defaults.outputRPCTXInfo);
}

function getOutputTestGPU(){
  return document.getElementById(ids.defaults.outputRPCTXInfo);
}

var pollId = null;
//var lastPollTime = null;
var ongoingPolls = {};
var finishedPolls = {};
function doPollServer(){
  //console.log("polling");
  var numOngoingCalls = Object.keys(ongoingPolls).length;
  if (numOngoingCalls === 0){
    clearInterval(pollId);
    pollId = null;
  }
  var resultHtml = "";
  resultHtml += `Last updated: ${new Date()}.<br>`; 
  resultHtml += jsonToHtml.getHtmlFromArrayOfObjects(ongoingPolls, true);
  getOutputTXInfoDiv().innerHTML = resultHtml;
}

function clearPollId(){
  if (pollId === null)
    return;
  clearInterval(pollId);
  pollId = null;
  //console.log("cleared poll");
}

function pollServerDoStart(){
  clearPollId();
  pollId = setInterval(doPollServer, 1000);
}

function pollServerStart(id, output){
  clearPollId();
  var callIdInfo = null;
  try {
    callIdInfo = JSON.parse(id);
  } catch (e) {
    output.innerHTML = `<error>Failed to extract job information. ${e}</error>`;
    return;
  }
  ongoingPolls = callIdInfo;
  pollServerDoStart();
}

function testGPUSha256(){
  submitRequests.submitGET({
    url: pathnames.getURLfromNodeCallLabel(pathnames.nodeCalls.testGPUSha256.nodeCallLabel),
    progress: getSpanProgress(),
    result: getOutputTestGPU(),
    callback: pollServerStart
  });
}

function synchronizeUnspentTransactions(){
  submitRequests.submitGET({
    url: pathnames.getURLfromNodeCallLabel(pathnames.nodeCalls.computeUnspentTransactions.nodeCallLabel),
    progress: getSpanProgress(),
    result : getOutputTXInfoDiv(),
    callback: pollServerStart
  });
}

module.exports = {
  synchronizeUnspentTransactions,
  testGPUSha256,
  pollServerDoStart,
  clearPollId
}