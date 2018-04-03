#!/usr/bin/env node
/**
 * Entry point for Kanban
 * 
 */

"use strict";
const pathnames = require('./pathnames')
const https = require('https');
const http = require('http');
const handleRequests = require('./handle_requests');
const fs = require('fs');
const execSync = require('child_process').execSync;
const handleRequest = require('./handle_requests');

// This line is from the Node.js HTTPS documentation.

if (!fs.existsSync(pathnames.pathnameCryptoKey)) {
  console.log("Key file: " + pathnames.pathnamePrivateKey + " appears not to exist. Let me create that for you. Answer all prompts please (enter for defaults). " );
  execSync("openssl req -new -newkey rsa:2048 -days 3000 -nodes -x509 -subj \"/C=CA/ST=ON/L=Waterloo/O=IMAltd/CN=none\" -keyout " + pathnames.pathnameCertificate + " -out " + project.pathnameCryptoCertificate);
}

var options = {
  cert: fs.readFileSync(pathnames.pathnameCertificate),
  key: fs.readFileSync(pathnames.pathnamePrivateKey)
};


var portHttps = 52907;
var portHttp = 51846;

var serverHTTPS = https.createServer(options, handleRequest);
serverHTTPS.listen(portHttps, function(){
  console.log(`Listening on https port: ${portHttps}`.green);
});

var serverHTTP = http.createServer(handleRequest);
serverHttp.listen(portHttp, function(){
  console.log(`Listening on http port: ${portHttp}`.yellow);
});