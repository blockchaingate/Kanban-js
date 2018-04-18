"use strict";
const pathnames = require('./pathnames');
const assert = require('assert')
const randomString = require('randomstring');
const sha256 = require('./opencl/sha256');

var numSimultaneousCalls = 0;
var maxSimultaneousCalls = 4;

var ongoingCalls = {};
var recentlyFinishedCalls = {};

function computeUnspentTransactions(id){

}

var gpuTest = {
  id: "",
  counterSha: 0,
  startTime: null
}
function testGPUSha256(){
  if (gpuTest.counterSha > 10000000){
    return;
  }
  if (gpuTest.counterSha === 0){
    gpuTest.startTime = (new Date()).getTime();
  }
  var nextGoal = gpuTest.counterSha + 1000;
  for (; gpuTest.counterSha ++; gpuTest.counterSha < nextGoal){ 
    sha256.gpuSHA256(randomString.generate(100));
    if (gpuTest.counterSha % 1000 === 0){
      var time = ((new Date()).getTime() - gpuTest.startTime ) / 1000; 
      console.log(`Computed ${gpuTest.counterSha} shas in ${time} second(s)`);
    }
  }
  process.nextTick(testGPUSha256);
}

function pollOngoing(request, response, callIds){
  try {
    if (! Array.isArray(callIds)){
      response.writeHead(400);
      return response.end(`Expected callIds to be an array, got ${JSON.stringify(callIds)} instead. `)
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

var handlers = {};
handlers[pathnames.nodeCalls.pollOngoing.nodeCallLabel] = pollOngoing;
handlers[pathnames.nodeCalls.computeUnspentTransactions.nodeCallLabel] = computeUnspentTransactions;
handlers[pathnames.nodeCalls.testGPUSha256.nodeCallLabel] = testGPUSha256;

for (var label in pathnames.nodeCalls){
  if (handlers[pathnames.nodeCalls.pollOngoing.nodeCallLabel] === undefined){
    assert.ok(false, `Handler of node call ${pathnames.nodeCalls.pollOngoing.nodeCallLabel} is not allowed to  be undefined. `);
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
  if (currentCommandLabel == pathnames.nodeCalls.pollOngoing.nodeCallLabel){
    return pollOngoing(request, response, desiredCommand.callIds);
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
    handlers[currentCommandLabel](request, response, desiredCommand);
  });
  response.writeHead(200);
  response.end(JSON.stringify({
    callId : callId 
  }));
}

module.exports = {
  handlers,
  dispatch
}