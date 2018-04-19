"use strict";
const pathnames = require('./pathnames');
const assert = require('assert')
const randomString = require('randomstring');
const childProcess = require('child_process');

function OpenCLDriver(){
  this.started = false;
  this.handleExecutable = null;
  this.numProcessed = 0;
  this.remaining = {};
}

OpenCLDriver.prototype.start = function (){
  if (this.started) {
    return;
  }
  this.started = true;
  this.handleExecutable = childProcess.execFile(pathnames.pathname.openCLDriver);
  console.log(`Process: ${pathnames.pathname.openCLDriver} spawned`.green);
  this.handleExecutable.on('exit', function(code){
    console.log(`OpenCL driver exited with code: ${code}.`.red);
    this.started = false;
    this.handleExecutable = null;
  });
  this.handleExecutable.stdout.on('data', function(data){
    var parsed = JSON.parse(data);
    var theOpenCLDriver = global.kanban.openCLDriver;
    theOpenCLDriver.remaining[parsed.id].response.writeHead(200);
    theOpenCLDriver.remaining[parsed.id].response.end(data);    
  });
}

OpenCLDriver.prototype.testPipeOneMessage = function (request, response, desiredCommand) {
  this.start();
  var messageType = typeof desiredCommand.message;
  if (messageType !== "string"){
    response.writeHead(200);
    response.end(`Wrong message type: ${messageType}.`);
    return;
  }
  console.log(`About to write to openCL. ${JSON.stringify(desiredCommand)}`);
  var theLength = desiredCommand.message.length; 
  this.remaining[this.numProcessed] = {
    length: theLength,
    command: desiredCommand,
    request: request,
    response: response
  }
  this.handleExecutable.stdin.write(`${theLength}\n`);
  this.handleExecutable.stdin.write(`${this.numProcessed}\n`);
  this.handleExecutable.stdin.write(desiredCommand.message);
  this.numProcessed ++;
}

function testPipe(request, response, desiredCommand){
  global.kanban.openCLDriver.testPipeOneMessage(request, response, desiredCommand);
}

function testPipeOneMessage(request, response, desiredCommand){
  global.kanban.openCLDriver.testPipeOneMessage(request, response, desiredCommand);
}

module.exports = {
  OpenCLDriver,
  testPipe,
  testPipeOneMessage
}