"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
const Block = require('../bitcoinjs_src/block');
const jobsServerSide = require('../jobs');

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
  return document.getElementById(ids.defaults.outputGPUTest);
}

var pollId = null;

if (window.kanban.jobs === undefined || window.kanban.jobs === null) {
  window.kanban.jobs = new jobsServerSide.Jobs();
}

var jobs = window.kanban.jobs;

function doPollServer(output) {
  //console.log(jobs.getOngoingIds());
  submitRequests.submitGET({
    url: pathnames.getURLfromNodeCallLabel(pathnames.nodeCalls.pollOngoing.nodeCallLabel),
    progress: getSpanProgress(),
    result: output,
    callback: doPollServerCallback
  });
}

function doPollServerCallback(inputText, output) {
  //console.log("polling");
  var numOngoingCalls = jobs.getNumberOfJobs();
  if (numOngoingCalls === 0){
    clearInterval(pollId);
    pollId = null;
  }
  var resultHtml = "";
  resultHtml += `Last updated: ${new Date()}.<br>`; 
  var outputElement, outputId;
  if (typeof output === "string"){
    outputId = output;
    outputElement = document.getElementById(output);
  } else {
    outputId = output.id;
    outputElement = output;
  }
  try {
    jobs.ongoing = JSON.parse(inputText);
    for (var callId in jobs.ongoing){
      if (jobs.ongoing[callId].status === pathnames.nodeCallStatuses.notFound) {
        delete jobs.ongoing[callId];
      }
    }

    var foundOngoing = false;
    resultHtml += `${Object.keys(jobs.ongoing).length} job(s).<br>`;
    for (var callId in jobs.ongoing){
      if (jobs.ongoing[callId].status !== pathnames.nodeCallStatuses.recentlyFinished) {
        foundOngoing = true;
        break;
      }
    }
    if (!foundOngoing){
      clearInterval(pollId);
    }
  } catch (e) {
    console.log(`${e}`);
    return;
  }
  resultHtml += jsonToHtml.getHtmlFromArrayOfObjects(jobs.ongoing, true, outputId);
  outputElement.innerHTML = resultHtml;
}

function clearPollId() {
  if (pollId === null) {
    return;
  }
  clearInterval(pollId);
  pollId = null;
  //console.log("cleared poll");
}

function pollServerDoStart(output) {
  clearPollId();
  pollId = setInterval(doPollServer.bind(null, output), 1000);
}

function pollServerStart(id, output) {
  clearPollId();
  var callIdInfo = null;
  try {
    callIdInfo = JSON.parse(id);
    jobs.ongoing[callIdInfo.callId] = callIdInfo;
  } catch (e) {
    output.innerHTML = `<error>Failed to extract job information. ${e}</error>`;
    return;
  }
  pollServerDoStart(output);
}

function testGPUSha256() {
  submitRequests.submitGET({
    url: pathnames.getURLfromNodeCallLabel(pathnames.nodeCalls.testGPUSha256.nodeCallLabel),
    progress: getSpanProgress(),
    result: getOutputTestGPU(),
    callback: pollServerStart
  });
}

function testBackEndSha256Multiple() {
  submitRequests.submitGET({
    url: pathnames.getURLfromNodeCallLabel(pathnames.nodeCalls.testBackEndSha256Multiple.nodeCallLabel),
    progress: getSpanProgress(),
    result: getOutputTestGPU(),
    callback: pollServerStart
  });
}

function testBackEndSha256OneMessage() {
  var theMessage = document.getElementById(ids.defaults.inputNodeCallTestMessage).value; 
  submitRequests.submitGET({
    url: pathnames.getURLfromNodeCallLabel(pathnames.nodeCalls.testBackEndSha256OneMessage.nodeCallLabel, { message: theMessage}),
    progress: getSpanProgress(),
    result: getOutputTestGPU()
  });
}

function testBackEndPipeMultiple() {
  submitRequests.submitGET({
    url: pathnames.getURLfromNodeCallLabel(pathnames.nodeCalls.testBackEndPipeMultiple.nodeCallLabel),
    progress: getSpanProgress(),
    result: getOutputTestGPU(),
    callback: pollServerStart
  });
}

function testBackEndPipeOneMessage() {
  var theMessage = document.getElementById(ids.defaults.inputNodeCallTestMessage).value; 
  submitRequests.submitGET({
    url: pathnames.getURLfromNodeCallLabel(pathnames.nodeCalls.testBackEndPipeOneMessage.nodeCallLabel, { message: theMessage}),
    progress: getSpanProgress(),
    result: getOutputTestGPU()
  });
}

function testBackEndSignOneMessage() {
  var theMessage = document.getElementById(ids.defaults.inputNodeCallTestMessage).value; 
  var theNonce = document.getElementById(ids.defaults.inputNodeCallTestNonce).value; 
  var theSecret = document.getElementById(ids.defaults.inputNodeCallTestSecretKey).value; 
  submitRequests.submitGET({
    url: pathnames.getURLfromNodeCallLabel(pathnames.nodeCalls.testBackEndSignOneMessage.nodeCallLabel, { message: theMessage, nonce: theNonce, secretKey: theSecret}),
    progress: getSpanProgress(),
    result: getOutputTestGPU()
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
  testBackEndSha256Multiple,
  testBackEndSha256OneMessage,
  testBackEndPipeMultiple,
  testBackEndPipeOneMessage,
  testBackEndSignOneMessage,
  pollServerDoStart,
  clearPollId
}