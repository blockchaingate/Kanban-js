"use strict";
const pathnames = require('./pathnames');
const assert = require('assert')
const randomString = require('randomstring');
const childProcess = require('child_process');
const openCLDriver = require('./open_cl_driver');

var numSimultaneousCalls = 0;
var maxSimultaneousCalls = 4;

var ongoingCalls = {};
var recentlyFinishedCalls = {};

function computeUnspentTransactions(id){

}


function pollOngoing(request, response, desiredCommand) {
  var callIds = desiredCommand.callIds;
  try {
    if (! Array.isArray(callIds)){
      response.writeHead(400);
      return response.end(`Expected callIds to be an array, got ${JSON.stringify(callIds)} instead. `);
    }
  } catch (e) { //<- this shouldn't happen: someone sent us badly behaved bytes in callIds.
    response.writeHead(500);
    return response.end("Internal server error while processing malformed input in pollOngoing");
  }
  var numIdsToReport = Math.min(maxSimultaneousCalls, callIds.length);
  var result = {};
  for (var counterIds = 0; counterIds < callIds.length; counterIds ++){
    var currentId = callIds[counterIds];
    if (currentId in ongoingCalls){
      result[currentId] = {
        status: "ongoing", 
        message: ongoingCalls[currentId]
      };
      continue;
    } 
    if (currentId in recentlyFinishedCalls){
      result[currentId] = {
        status: "recentlyFinished",
        message: recentlyFinishedCalls[currentId]
      };
      continue;
    } 
    result[currentId] = {
      status: "notFound"
    };
  }
  response.writeHead(200);
  response.end(JSON.stringify(response));  
}

var handlersReturnImmediately = {};
handlersReturnImmediately[pathnames.nodeCalls.computeUnspentTransactions.nodeCallLabel] = computeUnspentTransactions;
handlersReturnImmediately[pathnames.nodeCalls.testGPUSha256.nodeCallLabel] = null;

var handlersReturnWhenDone = {};
handlersReturnWhenDone[pathnames.nodeCalls.pollOngoing.nodeCallLabel] = pollOngoing;
handlersReturnWhenDone[pathnames.nodeCalls.testPipe.nodeCallLabel] = openCLDriver.testPipe;
handlersReturnWhenDone[pathnames.nodeCalls.testPipeOneMessage.nodeCallLabel] = openCLDriver.testPipeOneMessage;

for (var label in pathnames.nodeCalls) {
  var currentNodeCallLabel = pathnames.nodeCalls[label].nodeCallLabel;
  if (
    handlersReturnImmediately[currentNodeCallLabel] === undefined && 
    handlersReturnWhenDone[currentNodeCallLabel] === undefined
  ) {
    assert.ok(false, `Handler of node call ${currentNodeCallLabel} is not allowed to  be undefined. `);
  }
  if (
    handlersReturnImmediately[currentNodeCallLabel] !== undefined && 
    handlersReturnWhenDone[currentNodeCallLabel] !== undefined
  ) {
    assert.ok(false, `Node call ${currentNodeCallLabel} must have only one type of handler. `);
  }
}

function dispatch(request, response, desiredCommand){
  console.log(`command: ${JSON.stringify(desiredCommand)}, pathnames: ${pathnames}, nodeCallLabel = ${pathnames.nodeCallLabel}`);
  var isGood = false;
  var currentCommandLabel = desiredCommand[pathnames.nodeCallLabel];
  console.log(`nodecalllabel: ${pathnames.nodeCallLabel}, currentCommandLabel: ${JSON.stringify(currentCommandLabel)}`);
  if (typeof currentCommandLabel === "string") {
    isGood = currentCommandLabel in pathnames.nodeCalls;
  }
  if (!isGood) {
    response.writeHead(400);
    return response.end(`Command ${currentCommandLabel} not found`);
  }
  if (currentCommandLabel in handlersReturnWhenDone){
    console.log(`About to call handler of: ${currentCommandLabel}`);
    return handlersReturnWhenDone[currentCommandLabel](request, response, desiredCommand);
  }
  var numOngoingCalls = Object.keys(ongoingCalls).length; 
  if (numOngoingCalls > maxSimultaneousCalls){
    response.writeHead(200);
    response.end(`Maximum number of ongoing calls reached: ${numOngoingCalls}. `);
    return;
  }
  var timeInMilliseconds = (new Date()).getTime();
  var callId = `currentCommandLabel_${numOngoingCalls}_${timeInMilliseconds}`;
  ongoingCalls[callId] = pathnames.nodeCallStatuses.starting;
  process.nextTick(function(){
    handlersReturnImmediately[currentCommandLabel](request, response, desiredCommand);
  });
  response.writeHead(200);
  response.end(JSON.stringify({
    callId : callId 
  }));
}

module.exports = {
  handlersReturnImmediately,
  dispatch
}