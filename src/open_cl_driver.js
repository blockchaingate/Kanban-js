"use strict";
const pathnames = require('./pathnames');
const assert = require('assert')
const randomString = require('randomstring');
const childProcess = require('child_process');
const pseudoRandomGenerator = require('random-seed');
const crypto = require('crypto');
const miscellaneous = require('./miscellaneous');
const net = require('net');

function OpenCLDriver() {
  this.started = false;
  this.connected = false;
  this.handleExecutable = null;
  this.gpuConnections = {
    metaData: null,
    data: null,
    output: null
  };
  this.gpuConnectionPorts = {
    metaData: "49201",
    data: "48201",
    output: "47201"
  }
  this.numProcessed = 0;
  this.remaining = {};
  this.testMessages = [];
  this.testMessageResults = {};
  this.numLargeTestMessages = 100;
  this.numSmallTestMessages = 900;
  this.largeTestMessageApproximateTopSizeInMultiplesOf32 = 100000;
  this.smallTestMessageApproximateTopSizeInMultiplesOf32 = 1000;
  this.totalToTestSha256 = 50000;
  this.totalToTestBuffer = 100000;
  this.totalToTest = - 1;
  this.testGotBackFromCPPSoFar = 0;
  this.testBytesProcessedSoFar = 0;
  this.testStartTime = null;
  this.testScheduledSoFar = 0;
  this.currentCPPBuffer = "";
}

OpenCLDriver.prototype.generateMessages = function(numMessages, highBoundary) {
  var theGenerator = new pseudoRandomGenerator.create("Default pseudo-random seed.");
  var totalMessages = this.numLargeTestMessages + this.numSmallTestMessages;
  for (var counterMessage = 0; counterMessage < numMessages; counterMessage ++) {
    var sizeDivBy32 = theGenerator(highBoundary);
    var sha256 = crypto.createHash('sha256');
    sha256.update(`${sizeDivBy32}`);
    var currentSHA = sha256.digest();
    var nextString = "";
    for (var counterRepetitions = 0; counterRepetitions < sizeDivBy32; counterRepetitions ++) {
      nextString += currentSHA;
    }
    nextString += currentSHA.slice(0, (sizeDivBy32 + 5) % 32);
    this.testMessages.push(nextString);
    console.log(`Generated ${this.testMessages.length} out of ${totalMessages}: ${miscellaneous.shortenString(nextString, 40)}`);
  }
}

OpenCLDriver.prototype.initTestMessages = function (callId) {
  if (this.testMessages.length > 0) {
    return;
  }
  var jobs = global.kanban.jobs;
  jobs.setStatus(callId, "Generating test messages. ");
  this.generateMessages(this.numLargeTestMessages, this.largeTestMessageApproximateTopSizeInMultiplesOf32);
  this.generateMessages(this.numSmallTestMessages, this.smallTestMessageApproximateTopSizeInMultiplesOf32);
  jobs.setStatus(callId, "Generated test messages, starting test. ");
}

OpenCLDriver.prototype.processOutput = function(data) {
  var splitData = data.toString().split("\n");
  for (var counterData = 0; counterData < splitData.length; counterData ++) {
    if (splitData[counterData].length === 0)
      continue;
    this.processOutputOneChunk(splitData[counterData]);
  }
  return true;
}

OpenCLDriver.prototype.processOneTestJob = function(parsedOutput, gpuJob) {
  if (gpuJob.flagIsTest !== true) {
    return;
  }
  console.log(`Completed computation: ${parsedOutput.id}`.green);
  this.testGotBackFromCPPSoFar ++;
  if (parsedOutput.result === undefined) {
    console.log(`GPU message has no result entry: ${JSON.stringify(parsedOutput)}`.red);
    assert(false);
  }
  var theMessageIndex = gpuJob.messageIndex;
  if (theMessageIndex === undefined){
    console.log(`Test job has no message index: ${JSON.stringify(gpuJob)}`.red);
    assert(false);  
  }
  this.testBytesProcessedSoFar += this.testMessages[theMessageIndex].length;
  if (this.testMessageResults[theMessageIndex] === undefined) {
    this.testMessageResults[theMessageIndex] = parsedOutput.result;
  } else { 
    if (this.testMessageResults[theMessageIndex] != parsedOutput.result) {
      console.log(`Inconsistent SHA256: message of index: ${theMessageIndex} first sha-ed to: ${this.testMessageResults[theMessageIndex]}, but now is sha-ed to ${parsedOutput.result}` );
      assert(false);
    }
  }  
  var jobs = global.kanban.jobs;
  jobs.setStatus(gpuJob.callId, this.getTestProgress());
  if (this.testGotBackFromCPPSoFar >= this.totalToTest) {
    jobs.finishJob(gpuJob.callId, this.getTestProgress());
  }
}

OpenCLDriver.prototype.processOutputOneChunk = function(chunk) {
  var parsed = null;
  try {
    parsed = JSON.parse(chunk);
  } catch (e) { 
    console.log(`Failed to parse:` + `${chunk}`.red + `\nError: ` + `${e}`.red);
    return false;
  }
  if (parsed.id === undefined){
    console.log(`Chunk ${chunk} doesn't have an id.`.red);
    return false;    
  }
  if (!(parsed.id in this.remaining)) {
    console.log(`Uknown job id: ${parsed.id}. Chunk: ${chunk}` );
    return false;
  } 
  var gpuJob = this.remaining[parsed.id];
  this.processOneTestJob(parsed, gpuJob)
  console.log(`About to write back to id: ${parsed.id}`.yellow);
  if (gpuJob.response !== null && gpuJob.response !== undefined) {
    gpuJob.response.writeHead(200);
    gpuJob.response.end(JSON.stringify(parsed));  
  }
  return true;
}

OpenCLDriver.prototype.start = function () {
  if (this.started) {
    return;
  }
  this.started = true;
  this.connected = false;
  this.handleExecutable = childProcess.spawn(  
  //<- Warning: at the time of writing, childProcess.execFile will not flush the 
  //stdout buffer properly. 
  //Is the intended nodejs behavior? 
  //At any rate, use childProcess.spawn().
    pathnames.pathname.openCLDriverExecutable, {
      maxBuffer: 1000000, //Please note: this code should work with a small buffer too, say about 1000.
      //If not, it's a bug.
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
      cwd: pathnames.path.openCLDriverBuildPath,
      encoding: 'binary'
    },
    function(code, stdout, stderr) {
      console.log(`OpenCL driver exited with code: ${code}.`.red);
      var theOpenCLDriver = global.kanban.openCLDriver;
      theOpenCLDriver.started = false;
      theOpenCLDriver.handleExecutable = null;
    }
  );
  console.log(`Process: ${pathnames.pathname.openCLDriverExecutable} spawned`.green);
  this.handleExecutable.stdout.on('data', function(data) {
    console.log(data.toString());
  });
  this.handleExecutable.stderr.on('data', function(data) {
    console.log(data);
  });
}

OpenCLDriver.prototype.connectOutput = function () {
  console.log(`trying to connect to: output`.blue);
  this.gpuConnections.output = net.connect({port: this.gpuConnectionPorts.output}, function() {
    console.log(`Connected to port ${kanban.openCLDriver.gpuConnectionPorts.output}`.green);
    kanban.openCLDriver.connected = true;
  });
  this.gpuConnections.output.on('data', function(data) {
    kanban.openCLDriver.processOutput(data);
  });
  this.gpuConnections.output.on('error', function(error) {
    console.log(`Output pipe error: ${error}`.red);
    if (global.kanban.openCLDriver.connected) {
      return;
    }
    if (global.kanban.openCLDriver.connectPipeTimer !== null && global.kanban.openCLDriver.connectPipeTimer !== undefined) {
      clearTimeout(global.kanban.openCLDriver.connectPipeTimer);
    } 
    global.kanban.openCLDriver.connectPipeTimer = setTimeout(global.kanban.openCLDriver.connectOutput.bind(global.kanban.openCLDriver), 1000);
  });
}

OpenCLDriver.prototype.connectData = function () {
  console.log(`trying to connect to: data`.blue);
  this.gpuConnections.data = net.connect({port: this.gpuConnectionPorts.data}, function() {
    console.log(`Connected to port ${kanban.openCLDriver.gpuConnectionPorts.data}`.green);
    kanban.openCLDriver.connectOutput();
  });
  this.gpuConnections.data.on('error', function(error) {
    console.log(`Data pipe error: ${error}`.red);
    if (global.kanban.openCLDriver.connected){
      return;
    }
    if (global.kanban.openCLDriver.connectPipeTimer !== null && global.kanban.openCLDriver.connectPipeTimer !== undefined) {
      clearTimeout(global.kanban.openCLDriver.connectPipeTimer);
    } 
    global.kanban.openCLDriver.connectPipeTimer = setTimeout(global.kanban.openCLDriver.connectData.bind(global.kanban.openCLDriver), 1000);
  });
}

OpenCLDriver.prototype.connect = function () {
  if (this.connected) {
    return;
  }
  console.log(`trying to connect to: metadata`.blue);
  this.gpuConnections.metaData = net.connect({port: this.gpuConnectionPorts.metaData}, function() {
    console.log(`Connected to port ${kanban.openCLDriver.gpuConnectionPorts.metaData}`.green);
    kanban.openCLDriver.connectData();
  });
  this.gpuConnections.metaData.on('error', function(error) {
    console.log(`Meta data pipe error: ${error}`.red);
    console.log(`Perhaps the GPU is still warming up?`.yellow);
    if (global.kanban.openCLDriver.connected) {
      return;
    }
    if (global.kanban.openCLDriver.connectPipeTimer !== null && global.kanban.openCLDriver.connectPipeTimer !== undefined) {
      clearTimeout(global.kanban.openCLDriver.connectPipeTimer);
    } 
    global.kanban.openCLDriver.connectPipeTimer = setTimeout(global.kanban.openCLDriver.connect.bind(global.kanban.openCLDriver), 3000);
  });
}

OpenCLDriver.prototype.startAndConnect = function () {
  this.start();
  setTimeout(global.kanban.openCLDriver.connect.bind(global.kanban.openCLDriver), 2000);
}

OpenCLDriver.prototype.testBackEndSha256OneMessage = function (request, response, desiredCommand) {
  this.testGotBackFromCPPSoFar = 0;
  var messageType = typeof desiredCommand.message;
  if (messageType !== "string"){
    response.writeHead(200);
    return response.end(`Wrong message type: ${messageType}.`);
  }
  if (desiredCommand.message === ""){
    response.writeHead(200);
    return response.end(`Empty string not allowed. `);
  }
  console.log(`About to write to openCL. ${JSON.stringify(desiredCommand)}`);
  this.remaining[this.numProcessed] = {
    request: request,
    response: response,
    command: desiredCommand
  }
  this.pipeOneMessage(desiredCommand.message, pathnames.gpuCommands.SHA256);
}

OpenCLDriver.prototype.testBackEndPipeOneMessage = function (request, response, desiredCommand) {
  this.testGotBackFromCPPSoFar = 0;
  var messageType = typeof desiredCommand.message;
  if (messageType !== "string"){
    response.writeHead(200);
    return response.end(`Wrong message type: ${messageType}.`);
  }
  if (desiredCommand.message === ""){
    response.writeHead(200);
    return response.end(`Empty string not allowed. `);
  }
  console.log(`About to pipe one message... ${JSON.stringify(desiredCommand)}`);
  this.remaining[this.numProcessed] = {
    request: request,
    response: response,
    command: desiredCommand
  }
  this.pipeOneMessage(desiredCommand.message, pathnames.gpuCommands.testBuffer);
}

OpenCLDriver.prototype.pipeOneMessage = function (message, command) {
  this.startAndConnect();
  if (!this.connected) {
    clearTimeout(this.connectGPUtimer);
    this.connectGPUtimer = setTimeout(this.pipeOneMessage.bind(this, message, command), 300);
    return;
  }
  this.pipeOneMessagePartTwo(message, command);
}

OpenCLDriver.prototype.pipeOneMessagePartTwo = function (message, command) {
  if (this.remaining[this.numProcessed] === undefined) {
    this.remaining[this.numProcessed] = {};
  }
  try {
    //console.log("About to write ... ".blue);
    var bufferData = new Buffer(message, 'binary');
    var theLength = bufferData.byteLength;
    this.gpuConnections.metaData.write(`${theLength}\n${command}\n${this.numProcessed}\n`, 'utf8');
    this.gpuConnections.data.write(bufferData, 'binary');
    //let bufferHex = Buffer.from(message, 'binary');
    //console.log(`Wrote all ${message.length} bytes : ${miscellaneous.shortenString(bufferHex.toString('hex'), 2000)}`.blue);
  } catch (e){
    console.log(e);
    assert(false);
  }
  this.numProcessed ++;
}

OpenCLDriver.prototype.getTestProgress = function () {
  var currentTime = (new Date()).getTime();
  var elapsedSoFar = (currentTime - this.testStartTime)/1000;
  var bytesPerSecondInMB = ((this.testBytesProcessedSoFar / elapsedSoFar) / 1000000).toFixed(3);

  return `Progress: scheduled ${this.testScheduledSoFar} out of ${this.totalToTest}, completed ${this.testGotBackFromCPPSoFar}.<br>
  ${elapsedSoFar} second(s) elapsed. ${this.testBytesProcessedSoFar} bytes processed, speed: ${bytesPerSecondInMB} MB/s.`;
}

OpenCLDriver.prototype.testBackEndSha256Multiple = function (callId, recursionDepth) {
  //setImmediate(this.pipeOneMessage.bind(this,"abc".repeat(1000070)));
  //setImmediate(this.pipeOneMessage.bind(this,"cabc".repeat(100001)));
  
  this.initTestMessages(callId);
  var jobs = global.kanban.jobs;
  if (recursionDepth >= this.totalToTest){
    return;
  }
  var theIndex = recursionDepth % this.testMessages.length;
  this.remaining[this.numProcessed] = {
    flagIsTest: true,
    messageIndex: theIndex,
    callId: callId
  }
  jobs.setStatus(callId, this.getTestProgress());
  this.pipeOneMessage(this.testMessages[theIndex], pathnames.gpuCommands.SHA256);
  this.testScheduledSoFar ++;
  recursionDepth ++;
  setImmediate(this.testBackEndSha256Multiple.bind(this, callId, recursionDepth));
}

OpenCLDriver.prototype.testBackEndPipeMultiple = function (callId, recursionDepth) {
  //setImmediate(this.pipeOneMessage.bind(this,"abc".repeat(1000070)));
  //setImmediate(this.pipeOneMessage.bind(this,"cabc".repeat(100001)));
  
  this.initTestMessages(callId);
  var jobs = global.kanban.jobs;
  if (recursionDepth >= this.totalToTest) {
    return;
  }
  var theIndex = recursionDepth % this.testMessages.length;
  this.remaining[this.numProcessed] = {
    flagIsTest: true,
    messageIndex: theIndex,
    callId: callId
  }
  jobs.setStatus(callId, this.getTestProgress());
  this.pipeOneMessage(this.testMessages[theIndex], pathnames.gpuCommands.testBuffer);
  this.testScheduledSoFar ++;
  recursionDepth ++;
  setImmediate(this.testBackEndPipeMultiple.bind(this, callId, recursionDepth));
}

OpenCLDriver.prototype.testBackEndPipeMultipleStart = function (callId) {
  this.testGotBackFromCPPSoFar = 0;
  this.testBytesProcessedSoFar = 0;
  this.testScheduledSoFar = 0;
  this.totalToTest = this.totalToTestBuffer;
  this.testMessageResults = {};
  this.testStartTime = (new Date()).getTime();
  this.testBackEndPipeMultiple(callId, 0);
}

OpenCLDriver.prototype.testBackEndSha256MultipleStart = function (callId) {
  this.testGotBackFromCPPSoFar = 0;
  this.testBytesProcessedSoFar = 0;
  this.testScheduledSoFar = 0;
  this.totalToTest = this.totalToTestSha256;
  this.testMessageResults = {};
  this.testStartTime = (new Date()).getTime();
  this.testBackEndSha256Multiple(callId, 0);
}

function testBackEndSha256Multiple(callId) {
  global.kanban.openCLDriver.testBackEndSha256MultipleStart(callId);
}

function testBackEndSha256OneMessage(request, response, desiredCommand) {
  global.kanban.openCLDriver.testBackEndSha256OneMessage(request, response, desiredCommand);
}

function testBackEndPipeMultiple(callId) {
  global.kanban.openCLDriver.testBackEndPipeMultipleStart(callId);
}

function testBackEndPipeOneMessage(request, response, desiredCommand) {
  global.kanban.openCLDriver.testBackEndPipeOneMessage(request, response, desiredCommand);
}

module.exports = {
  OpenCLDriver,
  testBackEndSha256Multiple,
  testBackEndSha256OneMessage,
  testBackEndPipeMultiple,
  testBackEndPipeOneMessage
}