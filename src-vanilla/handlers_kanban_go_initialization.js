"use strict";
const url  = require('url');
const queryString = require('querystring');
const kanbanGOInitialization = require('./resources_kanban_go_initialization');
const pathnames = require('./pathnames');

function handleRequest(request, response) {
  if (request.method === "GET") {
    return handleRPCGET(request, response);
  }
  response.writeHead(400);
  return response.end(`Method not implemented: ${request.method} not implemented. `);
}

function handleRPCGET(request, response) {
  var parsedURL = null;
  try {
    parsedURL = url.parse(request.url);
  } catch (e) {
    response.writeHead(400);
    return response.end(`In handlers_kanban_go: bad RPC request: ${e}.`);
  }
  return handleRPCURLEncodedInput(request, response, parsedURL.query);
}

function handleRPCURLEncodedInput(request, response, messageBodyURLed) {
  var query = null;
  var queryCommand = null;
  try {
    query = queryString.parse(messageBodyURLed);
    queryCommand = JSON.parse(query.command);
  } catch (e) {
    response.writeHead(400);
    return response.end(`Bad RPC input. ${e}`);
  }
  return handleRPCArguments(request, response, queryCommand);
}

var numberRequestsRunning = 0;
var maxRequestsRunning = 4;

function getInitializationArguments(theCallLabel, queryCommand, errors) {
  return [];
}

function handleRPCArguments(request, response, queryCommand) {
  numberRequestsRunning ++;
  if (numberRequestsRunning > maxRequestsRunning) {
    response.writeHead(500);
    numberRequestsRunning --;
    return response.end(`Too many (${numberRequestsRunning}) requests running, maximum allowed: ${maxRequestsRunning}`);
  }
  var theCallLabel = queryCommand[pathnames.rpcCall];
  if (!(theCallLabel in kanbanGOInitialization)){
    response.writeHead(400);
    numberRequestsRunning --;
    return response.end(`Fabcoin initialization call label ${theCallLabel} not found. `);    
  }
  var errors = [];
  var theArguments = getInitializationArguments(theCallLabel, queryCommand, errors);
  if (errors.length > 0) {
    response.writeHead(200);
    return response.end(`{"error": "${errors[0]}"}`);
  }
  var theCall = kanbanGOInitialization.rpcCalls[theCallLabel];
  var theCommand = `${theCall.command}`;
  const defaultOptions = {
    cwd: undefined,
    env: process.env
  };
  console.log(`Executing fabcoin initialization command: ${theCommand}.`.blue);
  console.log(`Arguments: ${theArguments}.`.green);
  if (theCall.path !== undefined && theCall.path !== null && theCall.path !== "") {
    if (theCall.path in pathnames.pathsComputedAtRunTime) {
      console.log(`Path substitution: ${theCall.path} is replaced by: ${pathnames.pathsComputedAtRunTime[theCall.path]}`);
      theCall.path = pathnames.pathsComputedAtRunTime[theCall.path];
    }
    defaultOptions.cwd = theCall.path;
    console.log(`Command will start from: ${defaultOptions.cwd}`.yellow);
  }
  var finalData = "";
  var sentResponse = false;
  try {
    var child = childProcess.spawn(theCommand, theArguments, defaultOptions);
    child.stdout.on('data', function(data) {
      console.log(data.toString());
      finalData += data.toString();
    });
    child.stderr.on('data', function(data) {
      console.log(data.toString());
      finalData += data.toString();
    });
    child.on('error', function(data) {
      console.log(data.toString());
      numberRequestsRunning --;
      if (!sentResponse) {
        sentResponse = true;
        response.writeHead(200);
        response.end(`{"error": "${data}", "data": "${finalData}"}`);
      }
    });
    child.on('exit', function(code) {
      console.log(`Fabcoin initialization exited with code: ${code}`.green);
      numberRequestsRunning --;
      if (code === 0) {
        response.writeHead(200);
        if (finalData === "") {
          finalData = `Nothing to output: most likely your command was executed correctly.`;
        }
        response.end(finalData);
      } else {
        if (!sentResponse) {
          sentResponse = true;
          response.writeHead(200);
          response.end(`{"error": "${finalData}"}`);
        }
      }
    });
  } catch (e) {
    response.writeHead(500);
    numberRequestsRunning --;
    response.end(`Eror: ${escapeHtml(e)}. `);
    console.log(`Error: ${e}`);
  }
  return;
}

module.exports = {
  handleRequest
}