"use strict";
const pathnames = require('./pathnames');
const assert = require('assert')
const childProcess = require('child_process');
const pseudoRandomGenerator = require('random-seed');
const crypto = require('crypto');
const miscellaneous = require('./miscellaneous');
const net = require('net');

/////////////Test suites declaration

function TestSuiteSHA256(inputOwner) {
  this.owner = inputOwner;
  this.name = "testSHA256";
  this.messages = [];
  this.results = {};
  this.numberLargeMessages = 100;
  this.numberSmallMessages = 900;
  this.largeTestMessageApproximateTopSizeInMultiplesOf32 = 100000;
  this.smallTestMessageApproximateTopSizeInMultiplesOf32 = 1000;
  this.totalToTest = 10000;
  this.numberBackFromCPP = 0;
  this.numberBytesProcessed = 0;
  this.startTime = null;
  this.numberScheduled = 0;
}

function TestSuitePipeBuffer(inputOwner) {
  this.owner = inputOwner; 
  this.name = "testPipeBuffer";
  this.messages = [];
  this.numberLargeMessages = 100;
  this.numberSmallMessages = 900;
  this.largeTestMessageApproximateTopSizeInMultiplesOf32 = 100000;
  this.smallTestMessageApproximateTopSizeInMultiplesOf32 = 1000;
  this.totalToTest = 100000;
  this.numberBackFromCPP = 0;
  this.numberBytesProcessed = 0;
  this.startTime = null;
  this.numberScheduled = 0;
}

function TestSuiteSignatures(inputOwner) {
  this.owner = inputOwner;
  this.name = "testSignatures";
  this.messagesToSign = [];
  this.secretKeys = [];
  this.nonces = [];
  this.messages = [];
  this.results = {};
  this.numberDifferentMessages = 100;
  this.totalToTest = 10000;
  this.numberBackFromCPP = 0;
  this.startTime = null;
  this.numberBytesProcessed = 0;
  this.numberScheduled = 0;
}
/////////////End of test suites

TestSuiteSignatures.prototype.processFinishedJob = function(parsedOutput, gpuJob) {
  console.log(`Completed computation: ${parsedOutput.id}`.green);
  this.numberBackFromCPP ++;
  if (parsedOutput.result === undefined) {
    console.log(`GPU message has no result entry: ${JSON.stringify(parsedOutput)}`.red);
    assert(false);
  }
  var theMessageIndex = gpuJob.messageIndex;
  if (theMessageIndex === undefined) {
    console.log(`Test job has no message index: ${JSON.stringify(gpuJob)}`.red);
    assert(false);  
  }
  this.numberBytesProcessed += this.messages[theMessageIndex].length;
  if (this.results[theMessageIndex] === undefined) {
    this.results[theMessageIndex] = parsedOutput.result;
  } else { 
    if (this.results[theMessageIndex] != parsedOutput.result) {
      console.log(`Inconsistent signature: signature request index ${theMessageIndex} first signed to: ${this.results[theMessageIndex]}, but now is signed to ${parsedOutput.result}`);
      assert(false);
    }
  }  
  var jobs = global.kanban.jobs;
  jobs.setStatus(gpuJob.callId, this.getProgress());
  if (this.numberBackFromCPP >= this.totalToTest) {
    jobs.finishJob(gpuJob.callId, this.getProgress());
  }
}

TestSuiteSignatures.prototype.getProgress = function () {
  var currentTime = (new Date()).getTime();
  var elapsedSoFar = (currentTime - this.startTime) / 1000;
  var signaturesPerSecond = (this.numberBackFromCPP / elapsedSoFar).toFixed(3);

  return `Progress: scheduled ${this.numberScheduled} out of ${this.totalToTest}, completed ${this.numberBackFromCPP}.<br>
  ${elapsedSoFar} second(s) elapsed. Speed: ${signaturesPerSecond} signatures per second.`;
}

TestSuiteSignatures.prototype.initMessages = function(callId) {
  console.log(`DEBUG: initializing messages for test suite ${this.name}`);
  if (this.messages.length > 0) {
    return;
  }
  var jobs = global.kanban.jobs;
  jobs.setStatus(callId, `Generating test messages for test suite ${this.name}`);
  var currentString = "1";
  for (var counterMessage = 0; counterMessage < this.numberDifferentMessages; counterMessage ++) {
    var sha256nonce = crypto.createHash('sha256');
    var sha256secret = crypto.createHash('sha256');
    var sha256message = crypto.createHash('sha256');
    

    sha256nonce.update(currentString);
    var nonce = sha256nonce.digest();
    this.nonces.push(nonce);
    
    sha256secret.update(nonce);
    var secretKey = sha256secret.digest();
    this.secretKeys.push(secretKey);

    sha256message.update(secretKey);
    var messageToSign = sha256message.digest();
    this.messagesToSign.push(messageToSign);

    var messageSerialized = Buffer.concat([
      nonce,
      secretKey,
      messageToSign
    ]);
    this.messages.push(messageSerialized);
    currentString = messageToSign;
    console.log(`Generated message ${counterMessage}, length: ${messageSerialized.length}: ${messageSerialized.toString('hex')}`);
  }
  jobs.setStatus(callId, "Generated test messages, starting test. ");
}

function testSuiteInitMessageStats() {
  this.numberBackFromCPP = 0;
  this.numberBytesProcessed = 0;
  this.numberScheduled = 0;
  this.startTime = (new Date()).getTime();
}

function testSuiteGenerateMessages(numMessages, highBoundary) {
  var theGenerator = new pseudoRandomGenerator.create("Default pseudo-random seed.");
  var totalMessages = this.numberLargeMessages + this.numberSmallMessages;
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
    this.messages.push(nextString);
    console.log(`Generated ${this.messages.length} out of ${totalMessages}: ${miscellaneous.shortenString(nextString, 40)}`);
  }
}

function testSuiteInitMessages(callId) {
  console.log(`DEBUG: initializing messages for test suite ${this.name}`);
  if (this.messages.length > 0) {
    return;
  }
  var jobs = global.kanban.jobs;
  jobs.setStatus(callId, "Generating test messages. ");
  this.generateMessages(this.numberLargeMessages, this.largeTestMessageApproximateTopSizeInMultiplesOf32);
  this.generateMessages(this.numberSmallMessages, this.smallTestMessageApproximateTopSizeInMultiplesOf32);
  jobs.setStatus(callId, "Generated test messages, starting test. ");
}

TestSuiteSHA256.prototype.processFinishedJob = function(parsedOutput, gpuJob) {
  console.log(`Completed computation: ${parsedOutput.id}`.green);
  this.numberBackFromCPP ++;
  if (parsedOutput.result === undefined) {
    console.log(`GPU message has no result entry: ${JSON.stringify(parsedOutput)}`.red);
    assert(false);
  }
  var theMessageIndex = gpuJob.messageIndex;
  if (theMessageIndex === undefined) {
    console.log(`Test job has no message index: ${JSON.stringify(gpuJob)}`.red);
    assert(false);  
  }
  this.numberBytesProcessed += this.messages[theMessageIndex].length;
  if (this.results[theMessageIndex] === undefined) {
    this.results[theMessageIndex] = parsedOutput.result;
  } else { 
    if (this.results[theMessageIndex] != parsedOutput.result) {
      console.log(`Inconsistent SHA256: message of index: ${theMessageIndex} first sha-ed to: ${this.results[theMessageIndex]}, but now is sha-ed to ${parsedOutput.result}` );
      assert(false);
    }
  }  
  var jobs = global.kanban.jobs;
  jobs.setStatus(gpuJob.callId, this.getProgress());
  if (this.numberBackFromCPP >= this.totalToTest) {
    jobs.finishJob(gpuJob.callId, this.getProgress());
  }
}

function testSuiteGetProgress() {
  var currentTime = (new Date()).getTime();
  var elapsedSoFar = (currentTime - this.startTime) / 1000;
  var bytesPerSecondInMB = ((this.numberBytesProcessed / elapsedSoFar) / 1000000).toFixed(3);

  return `Progress: scheduled ${this.numberScheduled} out of ${this.totalToTest}, completed ${this.numberBackFromCPP}.<br>
  ${elapsedSoFar} second(s) elapsed. ${this.numberBytesProcessed} bytes processed, speed: ${bytesPerSecondInMB} MB/s.`;
}

TestSuitePipeBuffer.prototype.processFinishedJob = function(parsedOutput, gpuJob) {
  console.log(`Completed computation: ${parsedOutput.id}`.green);
  this.numberBackFromCPP ++;
  var theMessageIndex = gpuJob.messageIndex;
  if (theMessageIndex === undefined) {
    console.log(`Test job has no message index: ${JSON.stringify(gpuJob)}`.red);
    assert(false);  
  }
  this.numberBytesProcessed += this.messages[theMessageIndex].length;
  var jobs = global.kanban.jobs;
  jobs.setStatus(gpuJob.callId, this.getProgress());
  if (this.numberBackFromCPP >= this.totalToTest) {
    jobs.finishJob(gpuJob.callId, this.getProgress());
  }
}


TestSuiteSHA256.prototype.getProgress     = testSuiteGetProgress;
TestSuitePipeBuffer.prototype.getProgress = testSuiteGetProgress;

TestSuiteSHA256.prototype.initMessages     = testSuiteInitMessages;
TestSuitePipeBuffer.prototype.initMessages = testSuiteInitMessages;

TestSuiteSHA256.prototype.generateMessages     = testSuiteGenerateMessages;
TestSuitePipeBuffer.prototype.generateMessages = testSuiteGenerateMessages;

TestSuiteSHA256.prototype.initMessageStats     = testSuiteInitMessageStats;
TestSuitePipeBuffer.prototype.initMessageStats = testSuiteInitMessageStats;
TestSuiteSignatures.prototype.initMessageStats = testSuiteInitMessageStats;

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
  this.testSignatures = new TestSuiteSignatures();
  this.testSHA256 = new TestSuiteSHA256();
  this.testPipeBuffer = new TestSuitePipeBuffer();

  this.numProcessed = 0;
  this.remaining = {};
  this.totalToTest = - 1;
  this.currentCPPBuffer = "";
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

OpenCLDriver.prototype.processOutputOneChunk = function(chunk) {
  var parsed = null;
  try {
    parsed = JSON.parse(chunk);
  } catch (e) { 
    console.log(`Failed to parse:` + `${chunk}`.red + `\nError: ` + `${e}`.red);
    return false;
  }
  if (typeof parsed.id === "undefined") {
    console.log(`Chunk ${chunk} doesn't have an id.`.red);
    return false;    
  }
  if (!(parsed.id in this.remaining)) {
    console.log(`Uknown job id: ${parsed.id}. Chunk: ${chunk}`);
    return false;
  } 
  var gpuJob = this.remaining[parsed.id];
  if (gpuJob.flagIsTest === true) {
    if (
      gpuJob.testSuite === "testSignatures" || 
      gpuJob.testSuite === "testSHA256" ||
      gpuJob.testSuite === "testPipeBuffer"
    ) {
      this[gpuJob.testSuite].processFinishedJob(parsed, gpuJob)
    } else {
      console.log(`Unknown test suite: ${gpuJob.testSuite}. `.red);
    }
  }
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
  this.handleExecutable = childProcess.spawn (
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
    if (global.kanban.openCLDriver.connected) {
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

function getB32FromUserInputTestHexString(input) {
  var convertedVariableLength = Buffer.from(input, 'hex');
  var converted;
  if (convertedVariableLength.length < 32) {
    var otherBuffer = Buffer.alloc(32 - convertedVariableLength.length).fill(0);
    converted = Buffer.concat( [convertedVariableLength,  otherBuffer]);
  } else {
    converted = convertedVariableLength.slice(0, 32);
  }
  console.log(`About to return ${converted.toString('hex')}` );
  return converted;
}

OpenCLDriver.prototype.testBackEndSignOneMessage = function (request, response, desiredCommand) {
  if ((typeof desiredCommand.message) !== "string") {
    response.writeHead(200);
    return response.end(`Wrong message type: ${typeof desiredCommand.message}.`);
  }
  if ((typeof desiredCommand.nonce) !== "string") {
    response.writeHead(200);
    return response.end(`Wrong nonce type: ${typeof desiredCommand.nonce}.`);
  }
  if ((typeof desiredCommand.secretKey) !== "string") {
    response.writeHead(200);
    return response.end(`Wrong secret key type: ${typeof desiredCommand.secretKey}.`);
  }
  if (desiredCommand.message === "") {
    response.writeHead(200);
    return response.end(`Empty message not allowed. `);
  }
  if (desiredCommand.nonce === "") {
    response.writeHead(200);
    return response.end(`Empty nonce not allowed. `);
  }
  if (desiredCommand.secretKey === "") {
    response.writeHead(200);
    return response.end(`Empty secret key not allowed. `);
  }
  console.log(`About to write to openCL. ${JSON.stringify(desiredCommand)}`);
  this.remaining[this.numProcessed] = {
    request: request,
    response: response,
    command: desiredCommand
  }
  var messageSerialized = Buffer.concat([
    getB32FromUserInputTestHexString(desiredCommand.nonce),
    getB32FromUserInputTestHexString(desiredCommand.secretKey),
    getB32FromUserInputTestHexString(desiredCommand.message)
  ]);
  console.log("Message serialized hex: " + messageSerialized.toString('hex'));
  this.pipeOneMessage(messageSerialized, pathnames.gpuCommands.signOneMessage);
}

OpenCLDriver.prototype.testBackEndSha256OneMessage = function (request, response, desiredCommand) {
  this.testGotBackFromCPPSoFar = 0;
  var messageType = typeof desiredCommand.message;
  if (messageType !== "string") {
    response.writeHead(200);
    return response.end(`Wrong message type: ${messageType}.`);
  }
  if (desiredCommand.message === "") {
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
  this.testPipeBuffer.numberBackFromCPP = 0;
  var messageType = typeof desiredCommand.message;
  if (messageType !== "string") {
    response.writeHead(200);
    return response.end(`Wrong message type: ${messageType}.`);
  }
  if (desiredCommand.message === "") {
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

OpenCLDriver.prototype.testBackEndPipeMultiple = function (callId, recursionDepth) {
  //setImmediate(this.pipeOneMessage.bind(this,"abc".repeat(1000070)));
  //setImmediate(this.pipeOneMessage.bind(this,"cabc".repeat(100001)));
  console.log("About to call initMessages for testPipeBuffer");
  this.testPipeBuffer.initMessages(callId);
  console.log("Messages initialized in pipe multiple. ");
  console.log(`Recursion depth ${recursionDepth}, total to test: ${this.testPipeBuffer.totalToTest}`);
  
  var jobs = global.kanban.jobs;
  if (recursionDepth >= this.testPipeBuffer.totalToTest) {
    return;
  }
  var theIndex = recursionDepth % this.testPipeBuffer.messages.length;
  this.remaining[this.numProcessed] = {
    flagIsTest: true,
    messageIndex: theIndex,
    callId: callId,
    testSuite: "testPipeBuffer"
  }
  jobs.setStatus(callId, this.testPipeBuffer.getProgress());
  this.pipeOneMessage(this.testPipeBuffer.messages[theIndex], pathnames.gpuCommands.testBuffer);
  this.testScheduledSoFar ++;
  recursionDepth ++;
  setImmediate(this.testBackEndPipeMultiple.bind(this, callId, recursionDepth));
}

OpenCLDriver.prototype.testBackEndSha256Multiple = function (callId, recursionDepth) {
  //setImmediate(this.pipeOneMessage.bind(this,"abc".repeat(1000070)));
  //setImmediate(this.pipeOneMessage.bind(this,"cabc".repeat(100001)));
  
  this.testSHA256.initMessages(callId);
  var jobs = global.kanban.jobs;
  if (recursionDepth >= this.testSHA256.totalToTest) {
    return;
  }
  var theIndex = recursionDepth % this.testSHA256.messages.length;
  this.remaining[this.numProcessed] = {
    flagIsTest: true,
    messageIndex: theIndex,
    callId: callId,
    testSuite: "testSHA256"
  }
  jobs.setStatus(callId, this.testSHA256.getProgress());
  this.pipeOneMessage(this.testSHA256.messages[theIndex], pathnames.gpuCommands.SHA256);
  this.testSHA256.numberScheduled ++;
  recursionDepth ++;
  setImmediate(this.testBackEndSha256Multiple.bind(this, callId, recursionDepth));
} 

OpenCLDriver.prototype.testBackEndSignMultipleMessages = function (callId, recursionDepth) {
  //setImmediate(this.pipeOneMessage.bind(this,"abc".repeat(1000070)));
  //setImmediate(this.pipeOneMessage.bind(this,"cabc".repeat(100001)));
  
  this.testSignatures.initMessages(callId);
  var jobs = global.kanban.jobs;
  if (recursionDepth >= this.testSignatures.totalToTest) {
    return;
  }
  var theIndex = recursionDepth % this.testSignatures.messages.length;
  this.remaining[this.numProcessed] = {
    flagIsTest: true,
    messageIndex: theIndex,
    callId: callId,
    testSuite: "testSignatures"
  }
  jobs.setStatus(callId, this.testSignatures.getProgress());
  var currentMessage = this.testSignatures.messages[theIndex];
  console.log(`About to pipe one: index: ${theIndex}, message: ${currentMessage}.`);
  this.pipeOneMessage(currentMessage, pathnames.gpuCommands.signOneMessage);
  this.testSignatures.numberScheduled ++;
  recursionDepth ++;
  setImmediate(this.testBackEndSignMultipleMessages.bind(this, callId, recursionDepth));
} 

OpenCLDriver.prototype.testBackEndPipeMultipleStart = function (callId) {
  this.testPipeBuffer.initMessageStats();
  this.testBackEndPipeMultiple(callId, 0);
}

OpenCLDriver.prototype.testBackEndSha256MultipleStart = function (callId) {
  this.testSHA256.initMessageStats();
  this.testBackEndSha256Multiple(callId, 0);
}

OpenCLDriver.prototype.testBackEndSignMultipleMessagesStart = function (callId) {
  this.testSignatures.initMessageStats();
  this.testBackEndSignMultipleMessages(callId, 0);
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

function testBackEndSignOneMessage(request, response, desiredCommand) {
  global.kanban.openCLDriver.testBackEndSignOneMessage(request, response, desiredCommand);
}

function testBackEndSignMultipleMessages(callId) {
  global.kanban.openCLDriver.testBackEndSignMultipleMessagesStart(callId);
}

module.exports = {
  OpenCLDriver,
  testBackEndSha256Multiple,
  testBackEndSha256OneMessage,
  testBackEndPipeMultiple,
  testBackEndPipeOneMessage,
  testBackEndSignOneMessage,
  testBackEndSignMultipleMessages
}