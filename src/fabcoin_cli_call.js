"use strict";
const childProcess = require('child_process');
const colors = require('colors');
const pathnames = require('./pathnames');
const escapeHtml = require('escape-html');

var numberRequestsRunning = 0;
var maxRequestsRunning = 4;

function rpc_call(request, response, desiredCommand){
  numberRequestsRunning ++;
  if (numberRequestsRunning > maxRequestsRunning){
    response.writeHead(500);
    numberRequestsRunning--;
    return response.end(`Too many (${numberRequestsRunning}) requests running, maximum allowed: ${maxRequestsRunning}`);
  }
  if (desiredCommand[pathnames.rpcCallLabel] === undefined){
    response.writeHead(400);
    numberRequestsRunning --;
    return response.end(`Request is missing the ${pathnames.rpcCallLabel} entry. `);        
  }
  var theCallLabel = desiredCommand[pathnames.rpcCallLabel];
  if (!(theCallLabel in pathnames.rpcCalls)){
    response.writeHead(400);
    numberRequestsRunning --;
    return response.end(`RPC call label ${theCallLabel} not found. `);    
  }
  var errors = [];
  var theArguments = pathnames.getRPCcallArguments(theCallLabel, desiredCommand, errors);
  if (theArguments === null){
    response.writeHead(400);
    numberRequestsRunning--;
    if (errors.length > 0){
      response.end(`{"error":"${errors[0]}"`);
    } else {
      response.end("Error while extracting rpc call arguments. ");      
    }
    return;
  }
  var theCommand = `${pathnames.pathname.fabcoinCli}`;
  console.log(`Executing rpc command: ${theCommand}.`.blue);
  console.log(`Arguments: ${theArguments}.`.green);
  var finalData = "";
  try {
    var child = childProcess.spawn(theCommand, theArguments);
    child.stdout.on('data', function(data){
      console.log(data.toString());
      finalData += data.toString();
    });
    child.stderr.on('data', function(data){
      console.log(data.toString());
      finalData += data.toString();
    });
    child.on('exit', function(code){
      console.log(`RPC call exited with code: ${code}`.green);
      numberRequestsRunning --;
      if (code === 0){
        response.writeHead(200);
        response.end(finalData);
      } else {
        response.writeHead(200);
        response.end(`{"error": "${finalData}"}`);
      }
    });
  } catch (e){
    response.writeHead(500);
    numberRequestsRunning --;
    response.end(`Eror: ${escapeHtml(e)}. `);
    console.log(`Error: ${e}`);
  }
  return;
}

module.exports = {
  rpc_call
}