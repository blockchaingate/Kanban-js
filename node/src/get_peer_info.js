"use strict";
const childProcess = require('child_process');
const colors = require('colors');
const pathnames = require('./pathnames');
const escapeHtml = require('escape-html');

var numberRequestsRunning = 0;
var maxRequestsRunning = 1;

function getPeerInfo(request, response){
  if (numberRequestsRunning >= maxRequestsRunning){
    response.writeHead(200);
    return response.end(`Too many (${numberRequestsRunning}) get peer info requests, maximum allowed: ${maxRequestsRunning}`);
  }
  var theCommand = `${pathnames.pathname.fabcoinCli}`;
  var theArguments = [`--testnet`, `getpeerinfo`];
  console.log (`Executing rpc command: ${theCommand}.`.blue);
  response.writeHead(200);
  try {
    var child = childProcess.spawn(theCommand, theArguments);
    child.stdout.on ('data', function(data){
      console.log(data.toString());
      response.write(data.toString());
    });
    child.stderr.on ('data', function(data){
      console.log(data.toString());
      response.write(data.toString());
    });
    child.on ('exit', function(code){
      console.log(`Ingester exited with code: ${code}`.green);
      response.end();
    });
  } catch (e){
    response.end(`Eror: ${escapeHtml(e)}. `);
    console.log(`Error: ${e}`);
  }
  return;
}

module.exports = {
  getPeerInfo
}