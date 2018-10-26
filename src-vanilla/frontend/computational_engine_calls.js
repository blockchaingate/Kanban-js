"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
const Block = require('../bitcoinjs_src/block');
const jobsServerSide = require('../jobs');

function getPage() {
  return window.kanban.thePage;
}

function getSpanProgress() { 
  return document.getElementById(ids.defaults.progressReport);
}

function getOutputTXInfoDiv() {
  return document.getElementById(ids.defaults.outputRPCTXInfo);
}

function getOutputTestGPU() {
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
    url: pathnames.getURLfromComputationalEngineCall(pathnames.computationalEngineCalls.pollOngoing.computationalEngineCall),
    progress: getSpanProgress(),
    result: output,
    callback: doPollServerCallback
  });
}

function doPollServerCallback(inputText, output) {
  //console.log("polling");
  var numOngoingCalls = jobs.getNumberOfJobs();
  if (numOngoingCalls === 0) {
    clearInterval(pollId);
    pollId = null;
  }
  var resultHtml = "";
  resultHtml += `Last updated: ${new Date()}.<br>`; 
  var outputElement, outputId;
  if (typeof output === "string") {
    outputId = output;
    outputElement = document.getElementById(output);
  } else {
    outputId = output.id;
    outputElement = output;
  }
  try {
    jobs.ongoing = JSON.parse(inputText);
    for (var callId in jobs.ongoing) {
      if (jobs.ongoing[callId].status === pathnames.computationalEngineCallStatuses.notFound) {
        delete jobs.ongoing[callId];
      }
    }

    var foundOngoing = false;
    resultHtml += `${Object.keys(jobs.ongoing).length} job(s).<br>`;
    for (var callId in jobs.ongoing) {
      if (jobs.ongoing[callId].status !== pathnames.computationalEngineCallStatuses.recentlyFinished) {
        foundOngoing = true;
        break;
      }
    }
    if (!foundOngoing) {
      clearInterval(pollId);
    }
  } catch (e) {
    console.log(`${e}`);
    return;
  }
  var theJSONTransformer = new jsonToHtml.JSONTransformer();
  theJSONTransformer.writeJSONtoDOMComponent(
    jobs.ongoing, outputElement, {
    polling: {
      doPoll: true,
      output: outputId
    }
  });
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
    output.innerHTML = `<b style = 'color:red'>Failed to extract job information. ${e}</b>`;
    return;
  }
  pollServerDoStart(output);
}

function testGPUSha256() {
  submitRequests.submitGET({
    url: pathnames.getURLfromComputationalEngineCall(pathnames.computationalEngineCalls.testGPUSha256.computationalEngineCall),
    progress: getSpanProgress(),
    result: getOutputTestGPU(),
    callback: pollServerStart
  });
}

function testBackEndSha256Multiple() {
  submitRequests.submitGET({
    url: pathnames.getURLfromComputationalEngineCall(pathnames.computationalEngineCalls.testBackEndSha256Multiple.computationalEngineCall),
    progress: getSpanProgress(),
    result: getOutputTestGPU(),
    callback: pollServerStart
  });
}

function testBackEndSha256OneMessage() {
  var theMessage = document.getElementById(ids.defaults.inputComputationalEngineCallTestMessage).value; 
  submitRequests.submitGET({
    url: pathnames.getURLfromComputationalEngineCall(pathnames.computationalEngineCalls.testBackEndSha256OneMessage.computationalEngineCall, { message: theMessage}),
    progress: getSpanProgress(),
    result: getOutputTestGPU()
  });
}

function testBackEndPipeMultiple() {
  submitRequests.submitGET({
    url: pathnames.getURLfromComputationalEngineCall(pathnames.computationalEngineCalls.testBackEndPipeMultiple.computationalEngineCall),
    progress: getSpanProgress(),
    result: getOutputTestGPU(),
    callback: pollServerStart
  });
}

function testBackEndPipeOneMessage() {
  var theMessage = document.getElementById(ids.defaults.inputComputationalEngineCallTestMessage).value; 
  submitRequests.submitGET({
    url: pathnames.getURLfromComputationalEngineCall(pathnames.computationalEngineCalls.testBackEndPipeOneMessage.computationalEngineCall, { message: theMessage}),
    progress: getSpanProgress(),
    result: getOutputTestGPU()
  });
}

function testBackEndSignOneMessage() {
  var theMessage = document.getElementById(ids.defaults.inputComputationalEngineCallTestMessage).value; 
  var theNonce = document.getElementById(ids.defaults.inputComputationalEngineCallTestNonce).value; 
  var theSecret = document.getElementById(ids.defaults.inputComputationalEngineCallTestSecretKey).value; 
  submitRequests.submitGET({
    url: pathnames.getURLfromComputationalEngineCall(
      pathnames.computationalEngineCalls.testBackEndSignOneMessage.computationalEngineCall, { 
        message: theMessage, 
        nonce: theNonce, 
        secretKey: theSecret
      }
    ),
    progress: getSpanProgress(),
    result: getOutputTestGPU()
  });  
}

function testBackEndSignMultipleMessages() {
  submitRequests.submitGET({
    url: pathnames.getURLfromComputationalEngineCall(pathnames.computationalEngineCalls.testBackEndSignMultipleMessages.computationalEngineCall),
    progress: getSpanProgress(),
    result: getOutputTestGPU(),
    callback: pollServerStart
  });
}

function synchronizeUnspentTransactions() {
  submitRequests.submitGET({
    url: pathnames.getURLfromComputationalEngineCall(pathnames.computationalEngineCalls.computeUnspentTransactions.computationalEngineCall),
    progress: getSpanProgress(),
    result : getOutputTXInfoDiv(),
    callback: pollServerStart
  });
}

function testBackEndEngineSha256() {
  submitRequests.submitGET({
    url: pathnames.getURLfromComputationalEngineCall(pathnames.computationalEngineCalls.testBackEndEngineSha256.computationalEngineCall),
    progress: getSpanProgress(),
    result : getOutputTXInfoDiv(),
    callback: pollServerStart
  });  
}

module.exports = {
  synchronizeUnspentTransactions,
  testGPUSha256,
  testBackEndEngineSha256,
  testBackEndSha256Multiple,
  testBackEndSha256OneMessage,
  testBackEndPipeMultiple,
  testBackEndPipeOneMessage,
  testBackEndSignOneMessage,
  testBackEndSignMultipleMessages,
  pollServerDoStart,
  clearPollId
}