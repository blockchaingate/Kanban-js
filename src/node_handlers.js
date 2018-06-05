"use strict";
const pathnames = require('./pathnames');
const assert = require('assert')
const childProcess = require('child_process');
const openCLDriver = require('./open_cl_driver');
var jobs = global.kanban.jobs;

function computeUnspentTransactions(id){

}

function pollOngoing(request, response, desiredCommand) {
  var callIds = desiredCommand.callIds;
  //console.log(`Call ids so far: ${JSON.stringify(callIds)}`);
  if (!Array.isArray(callIds)) {
    callIds = [];
    callIds = callIds.concat(Object.keys(jobs.ongoing), Object.keys(jobs.recentlyFinished));
  }
  var numIdsToReport = Math.min(maxSimultaneousCalls, callIds.length);
  var result = {};
  //console.log(`Extracting ids from: ${JSON.stringify(callIds)}`);
  for (var counterIds = 0; counterIds < callIds.length; counterIds ++) {
    var currentId = callIds[counterIds];
    if (currentId in jobs.ongoing){
      result[currentId] = {
        status: "ongoing", 
        message: jobs.ongoing[currentId]
      };
      continue;
    } 
    if (currentId in jobs.recentlyFinished){
      result[currentId] = {
        status: pathnames.nodeCallStatuses.recentlyFinished,
        message: jobs.recentlyFinished[currentId]
      };
      continue;
    } 
    result[currentId] = {
      status: pathnames.nodeCallStatuses.notFound
    };
  }
  response.writeHead(200);
  response.end(JSON.stringify(result));  
}

var handlersReturnImmediately = {};
handlersReturnImmediately[pathnames.nodeCalls.computeUnspentTransactions.nodeCall] = computeUnspentTransactions;
handlersReturnImmediately[pathnames.nodeCalls.testGPUSha256.nodeCall] = null;
handlersReturnImmediately[pathnames.nodeCalls.testBackEndSha256Multiple.nodeCall] = openCLDriver.testBackEndSha256Multiple;
handlersReturnImmediately[pathnames.nodeCalls.testBackEndPipeMultiple.nodeCall] = openCLDriver.testBackEndPipeMultiple;
handlersReturnImmediately[pathnames.nodeCalls.testBackEndSignMultipleMessages.nodeCall] = openCLDriver.testBackEndSignMultipleMessages;

var handlersReturnWhenDone = {};
handlersReturnWhenDone[pathnames.nodeCalls.pollOngoing.nodeCall] = pollOngoing;
handlersReturnWhenDone[pathnames.nodeCalls.testBackEndSha256OneMessage.nodeCall] = openCLDriver.testBackEndSha256OneMessage;
handlersReturnWhenDone[pathnames.nodeCalls.testBackEndPipeOneMessage.nodeCall] = openCLDriver.testBackEndPipeOneMessage;
handlersReturnWhenDone[pathnames.nodeCalls.testBackEndSignOneMessage.nodeCall] = openCLDriver.testBackEndSignOneMessage;
handlersReturnWhenDone[pathnames.nodeCalls.testBackEndEngineSha256.nodeCall] = openCLDriver.testBackEndEngineSha256;

for (var label in pathnames.nodeCalls) {
  var currentnodeCall = pathnames.nodeCalls[label].nodeCall;
  if (
    handlersReturnImmediately[currentnodeCall] === undefined && 
    handlersReturnWhenDone[currentnodeCall] === undefined
  ) {
    assert.ok(false, `Handler of node call ${currentnodeCall} is not allowed to  be undefined. `);
  }
  if (
    handlersReturnImmediately[currentnodeCall] !== undefined && 
    handlersReturnWhenDone[currentnodeCall] !== undefined
  ) {
    assert.ok(false, `Node call ${currentnodeCall} must have only one type of handler. `);
  }
}

var numSimultaneousCalls = 0;
var maxSimultaneousCalls = 4;
function dispatch(request, response, desiredCommand) {
  //console.log(`command: ${JSON.stringify(desiredCommand)}, nodeCall = ${pathnames.nodeCall}`);
  var isGood = false;
  var currentCommandLabel = desiredCommand[pathnames.nodeCall];
  //console.log(`nodeCall: ${pathnames.nodeCall}, currentCommandLabel: ${JSON.stringify(currentCommandLabel)}`);
  if (typeof currentCommandLabel === "string") {
    isGood = currentCommandLabel in pathnames.nodeCalls;
  }
  if (!isGood) {
    response.writeHead(400);
    return response.end(`Command ${currentCommandLabel} not found`);
  }
  if (currentCommandLabel in handlersReturnWhenDone){
    //console.log(`About to call handler of: ${currentCommandLabel} with input command: ${JSON.stringify(desiredCommand)}`);
    return handlersReturnWhenDone[currentCommandLabel](request, response, desiredCommand);
  }
  var numOngoingCalls = jobs.getNumberOfJobs(); 
  if (numOngoingCalls > maxSimultaneousCalls){
    response.writeHead(200);
    response.end(`Maximum number of ongoing calls reached: ${numOngoingCalls}. `);
    return;
  }
  var callId = jobs.addJob(handlersReturnImmediately[currentCommandLabel], currentCommandLabel);
  response.writeHead(200);
  response.end(JSON.stringify({
    callId : callId 
  }));
}

module.exports = {
  handlersReturnImmediately,
  dispatch
}