"use strict";
const pathnames = require('./pathnames');
const assert = require('assert')
const randomString = require('randomstring');
const childProcess = require('child_process');
const pseudoRandomGenerator = require('random-seed');
const crypto = require('crypto');
const miscellaneous = require('./miscellaneous');

function OpenCLDriver(){
  this.started = false;
  this.handleExecutable = null;
  this.numProcessed = 0;
  this.remaining = {};
  this.testMessages = [];
  this.numLargeTestMessages = 1;
  this.numSmallTestMessages = 0;
  this.largeTestMessageApproximateTopSizeInMultiplesOf32 = 100; //100000;
  this.smallTestMessageApproximateTopSizeInMultiplesOf32 = 1000;
  this.totalToTest = 2;//100000;
  this.testGotBackFromCPPSoFar = 0;
  this.testScheduledSoFar = 0;
}

OpenCLDriver.prototype.generateMessages = function(numMessages, highBoundary){
  var theGenerator = new pseudoRandomGenerator.create("Default pseudo-random seed.");
  var totalMessages = this.numLargeTestMessages + this.numSmallTestMessages;
  for (var counterMessage = 0; counterMessage < numMessages; counterMessage ++){
    var sizeDivBy32 = theGenerator(highBoundary);
    var sha256 = crypto.createHash('sha256');
    sha256.update(`${sizeDivBy32}`);
    var currentSHA = sha256.digest();
    var nextString = "";
    for (var counterRepetitions = 0; counterRepetitions < sizeDivBy32; counterRepetitions ++){
      nextString += currentSHA;
    }
    nextString += currentSHA.slice(0, (sizeDivBy32 + 5) % 32);
    this.testMessages.push(nextString);
    console.log(`Generated ${this.testMessages.length} out of ${totalMessages}: ${miscellaneous.shortenString(nextString, 40)}`);
  }
}

OpenCLDriver.prototype.initTestMessages = function (callId){
  if (this.testMessages.length > 0){
    return;
  }
  var jobs = global.kanban.jobs;
  jobs.setStatus(callId, "Generating test messages. ");
  this.generateMessages(this.numLargeTestMessages, this.largeTestMessageApproximateTopSizeInMultiplesOf32);
  this.generateMessages(this.numSmallTestMessages, this.smallTestMessageApproximateTopSizeInMultiplesOf32);
//  this.testMessages[0] = randomString.generate(2000) + "\n" + randomString.generate(2000);
  jobs.setStatus(callId, "Generated test messages, starting test. ");
}

OpenCLDriver.prototype.start = function (){
  if (this.started) {
    return;
  }
  this.started = true;
  this.handleExecutable = childProcess.execFile(
    pathnames.pathname.openCLDriver, {
      maxBuffer: 10000000,
      encoding: 'binary'
    },
    function(code, stdout, stderr){
      console.log(`OpenCL driver exited with code: ${code}.`.red);
      //console.log(stdout);
      //console.log(stderr);
      var theOpenCLDriver = global.kanban.openCLDriver;
      theOpenCLDriver.started = false;
      theOpenCLDriver.handleExecutable = null;
    }
  );
  console.log(`Process: ${pathnames.pathname.openCLDriver} spawned`.green);
  try{
    this.handleExecutable.stdout.on('data', function(data){
      console.log(`Incoming data:\n${data}`.yellow);
      var theOpenCLDriver = global.kanban.openCLDriver;
      var parsed = JSON.parse(data);
      if (theOpenCLDriver.remaining[parsed.id].response === undefined || theOpenCLDriver.remaining[parsed.id].response === null){
        console.log(`Completed computation: ${parsed.id}`.green);
        theOpenCLDriver.testGotBackFromCPPSoFar ++;
        return;
      }
      console.log("About to write back ...".yellow);
      theOpenCLDriver.remaining[parsed.id].response.writeHead(200);
      theOpenCLDriver.remaining[parsed.id].response.end(data);    
    });
    //this.handleExecutable.stdout.on('error', function(error){
    //  console.log(`Error in gpu output: ${error}`.red);
    //});
    //this.handleExecutable.stdin.on('error', function(error){
    //  console.log(`Error in gpu input: ${error}`.red);
    //});
    //this.handleExecutable.on('error', function(error){
    //  console.log(`${error}`.red);    
    //});
  } catch (e){
    console.log(`Fatal exception ${e}.`);
  }
  console.log("Got to here");
}

OpenCLDriver.prototype.testPipeOneMessage = function (request, response, desiredCommand) {
  console.log("Got to here");
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
  this.pipeOneMessage(desiredCommand.message);
}

OpenCLDriver.prototype.pipeOneMessage = function (message) {
  this.start();
  if (this.remaining[this.numProcessed] === undefined){
    this.remaining[this.numProcessed] = {};
  }
  try {
    console.log("About to write ... ".blue);
    var buffer = new Buffer(message, 'binary');
    var theLength = buffer.byteLength;
    this.handleExecutable.stdin.write(`${theLength}\n`);
    this.handleExecutable.stdin.write(`${this.numProcessed}\n`);
    this.handleExecutable.stdin.write(buffer);
    let bufferHex = Buffer.from(message, 'binary');
    console.log(`Wrote all ${message.length} bytes : ${miscellaneous.shortenString(bufferHex.toString('hex'), 2000)}`.blue);
  } catch (e){
    console.log(e);
    assert(false);
  }
  this.numProcessed ++;
}

OpenCLDriver.prototype.getTestProgress = function () {
  return `Progress: scheduled ${this.testScheduledSoFar} out of ${this.totalToTest}, completed ${this.testGotBackFromCPPSoFar}.`;
}

OpenCLDriver.prototype.testPipeBackEnd = function (callId, recursionDepth) {
  //setImmediate(this.pipeOneMessage.bind(this,"abc".repeat(1000070)));
  //setImmediate(this.pipeOneMessage.bind(this,"cabc".repeat(100001)));
  
  this.initTestMessages(callId);
  var jobs = global.kanban.jobs;
  jobs.setStatus(callId, this.getTestProgress());
  if (recursionDepth >= this.totalToTest){
    return;
  }
  var theIndex = recursionDepth % this.testMessages.length;
  this.pipeOneMessage(this.testMessages[theIndex]);
  this.testScheduledSoFar ++;
  recursionDepth ++;
  setImmediate(this.testPipeBackEnd.bind(this, callId, recursionDepth));
}

function testPipeBrowserToGPU(request, response, desiredCommand){
  global.kanban.openCLDriver.testPipeOneMessage(request, response, desiredCommand);
}

function testPipeBackEnd(callId){
  global.kanban.openCLDriver.testPipeBackEnd(callId, 0);
}

function testPipeOneMessage(request, response, desiredCommand){
  global.kanban.openCLDriver.testPipeOneMessage(request, response, desiredCommand);
}

module.exports = {
  OpenCLDriver,
  testPipeBrowserToGPU,
  testPipeBackEnd,
  testPipeOneMessage
}