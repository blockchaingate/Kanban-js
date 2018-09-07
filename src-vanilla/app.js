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
const configuration = require('./configuration');
const buildFrontEnd = require('./build_frontend');
const initializeOpenCLDriver = require('./initialize_opencl_driver');
const initializeFolders = require('./initialize_opencl_driver');
const certificateOptions = require('./initialize_certificates');
const handleRequests = require('./handle_requests'); 
const kanbanGoInitialization = require('./handlers_kanban_go_initialization');

configuration.defaultConfiguration = new configuration.Configuration();

initializeOpenCLDriver.initializeOpenCLDriver();
//<- Creates and starts the openCL driver.
//<- At the time of writing, the driver is disabled with a hard-coded flag.

initializeFolders.initializeOpenCLDriver();
//<- Find the location of the .fabcoin configuration folder (log files, ...)

certificateOptions.defaultCertificates = new certificateOptions.CertificateOptions(); 
//<-Read/create certificates as necessary. 

buildFrontEnd.buildFrontEnd();
//<- builds the frontend javascript from source using browserify.

kanbanGoInitialization.defaultInitializer = new kanbanGoInitialization.KanbanGoInitializerBackend();
//<- must come after openCL driver loading, even if the driver is disabled.

var serverHTTPS = https.createServer(certificateOptions.defaultCertificates.options, handleRequests.handleRequests);
serverHTTPS.listen(pathnames.ports.https, function() {
  console.log(`Listening on https port: ${pathnames.ports.https}`.green);
});

var serverHTTP = http.createServer(handleRequests.handleRequestsHTTP);
serverHTTP.listen(pathnames.ports.http, function() {
  console.log(`Listening on http port: ${pathnames.ports.http}`.yellow);
});