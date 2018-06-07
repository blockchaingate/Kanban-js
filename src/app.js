#!/usr/bin/env node
/**
 * Entry point for Kanban
 * 
 */

"use strict";
const pathnames = require('./pathnames');
const https = require('https');
const http = require('http');
const colors = require('colors');

require('./initialize_opencl_driver').initializeOpenCLDriver();
//<- Creates and starts the openCL driver.
//<- At the time of writing, the driver is disabled with a hard-coded flag.

require('./initialize_fabcoin_folders').initializeFolders();
//<- Find the location of the .fabcoin configuration folder (log files, ...)

var certificateOptions = require('./initialize_certificates').getCertificateOptions(); 
//<-Read/create certificates as necessary. 

const buildFrontEnd = require('./build_frontend').buildFrontEnd();
//<- builds the frontend javascript from source using browserify.

const handleRequests = require('./handle_requests'); 
//<- must come after openCL driver loading, even if the driver is disabled.

var portHttps = 52907;
var portHttp = 51846;

var serverHTTPS = https.createServer(certificateOptions, handleRequests.handleRequests);
serverHTTPS.listen(portHttps, function() {
  console.log(`Listening on https port: ${portHttps}`.green);
});

var serverHTTP = http.createServer(handleRequests.handleRequests);
serverHTTP.listen(portHttp, function(){
  console.log(`Listening on http port: ${portHttp}`.yellow);
});