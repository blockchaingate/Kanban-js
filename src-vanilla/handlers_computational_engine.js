"use strict";
const pathnames = require('./pathnames');
const assert = require('assert')
const childProcess = require('child_process');
const openCLDriver = require('./open_cl_driver');
const globals = require('./globals');
const resourcesOther = require('./resources_other_rpc');
var engineCalls = resourcesOther.computationalEngineCalls;
var engineCallStatuses = resourcesOther.computationalEngineCallStatuses; 

function computeUnspentTransactions(id) {

}

function pollOngoing(request, response, desiredCommand) {
  var callIds = desiredCommand.callIds;
  var jobs = global.kanban.jobs;
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
    if (currentId in jobs.ongoing) {
      result[currentId] = {
        status: "ongoing", 
        message: jobs.ongoing[currentId]
      };
      continue;
    } 
    if (currentId in jobs.recentlyFinished){
      result[currentId] = {
        status: engineCallStatuses.recentlyFinished,
        message: jobs.recentlyFinished[currentId]
      };
      continue;
    } 
    result[currentId] = {
      status: engineCallStatuses.notFound
    };
  }
  response.writeHead(200);
  response.end(JSON.stringify(result));  
}

var handlersReturnImmediately = {};
handlersReturnImmediately[engineCalls.computeUnspentTransactions.computationalEngineCall] = computeUnspentTransactions;
handlersReturnImmediately[engineCalls.testGPUSha256.computationalEngineCall] = null;
handlersReturnImmediately[engineCalls.testBackEndSha256Multiple.computationalEngineCall] = openCLDriver.testBackEndSha256Multiple;
handlersReturnImmediately[engineCalls.testBackEndPipeMultiple.computationalEngineCall] = openCLDriver.testBackEndPipeMultiple;
handlersReturnImmediately[engineCalls.testBackEndSignMultipleMessages.computationalEngineCall] = openCLDriver.testBackEndSignMultipleMessages;

var handlersReturnWhenDone = {};
handlersReturnWhenDone[engineCalls.pollOngoing.computationalEngineCall] = pollOngoing;
handlersReturnWhenDone[engineCalls.testBackEndSha256OneMessage.computationalEngineCall] = openCLDriver.testBackEndSha256OneMessage;
handlersReturnWhenDone[engineCalls.testBackEndPipeOneMessage.computationalEngineCall] = openCLDriver.testBackEndPipeOneMessage;
handlersReturnWhenDone[engineCalls.testBackEndSignOneMessage.computationalEngineCall] = openCLDriver.testBackEndSignOneMessage;
handlersReturnWhenDone[engineCalls.testBackEndEngineSha256.computationalEngineCall] = openCLDriver.testBackEndEngineSha256;

for (var label in engineCalls) {
  var currentcomputationalEngineCall = engineCalls[label].computationalEngineCall;
  if (
    handlersReturnImmediately[currentcomputationalEngineCall] === undefined && 
    handlersReturnWhenDone[currentcomputationalEngineCall] === undefined
  ) {
    assert.ok(false, `Handler of node call ${currentcomputationalEngineCall} is not allowed to  be undefined. `);
  }
  if (
    handlersReturnImmediately[currentcomputationalEngineCall] !== undefined && 
    handlersReturnWhenDone[currentcomputationalEngineCall] !== undefined
  ) {
    assert.ok(false, `Node call ${currentcomputationalEngineCall} must have only one type of handler. `);
  }
}

var numSimultaneousCalls = 0;
var maxSimultaneousCalls = 4;
function dispatch(request, response, desiredCommand) {
  var jobs = global.kanban.jobs;
  //console.log(`command: ${JSON.stringify(desiredCommand)}, computationalEngineCall = ${pathnames.computationalEngineCall}`);
  if (!globals.openCLDriver().enabled) {
    response.writeHead(200);
    return response.end(`Server-side computations/openCL have been disabled from source code (file src/app.js).`);
  }

  var isGood = false;
  var currentCommandLabel = desiredCommand[pathnames.computationalEngineCall];
  //console.log(`computationalEngineCall: ${pathnames.computationalEngineCall}, currentCommandLabel: ${JSON.stringify(currentCommandLabel)}`);
  if (typeof currentCommandLabel === "string") {
    isGood = currentCommandLabel in engineCalls;
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
  if (numOngoingCalls > maxSimultaneousCalls) {
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