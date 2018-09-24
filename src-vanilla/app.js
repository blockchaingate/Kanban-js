#!/usr/bin/env node
/**
 * Entry point for Kanban
 * 
 */

"use strict";
const pathnames = require('./pathnames');
const https = require('https');
const http = require('http');
require('colors');
const configuration = require('./configuration');
const buildFrontEnd = require('./build_frontend');
const initializeOpenCLDriver = require('./initialize_opencl_driver');
const certificateOptions = require('./initialize_certificates');
const handleRequests = require('./handle_requests'); 
const kanbanGoInitialization = require('./handlers_kanban_go_initialization');
const fabcoinInitialization = require('./initialize_fabcoin_folders');

/**Handlers for various configurations*/
global.kanban = {
  /**@type {Configuration} */
  configuration: null,
  certificateOptions: null,
  /**@type {module:handlersKanbanGoInitialization.KanbanGoInitializer} */ 
  kanbanGOInitializer: null,
  jobs: null,
  openCLDriver: null
};
//The initialization order matters: some initializations depend on the previous ones. 
//Most initializations depend on 
//global.kanban.configuration

//Server general configuration, read from secrets_admin/configuration.json:
global.kanban.configuration = new configuration.Configuration();

//Server ssl certificates:
global.kanban.certificateOptions = new certificateOptions.CertificateOptions();

//Compute kanban go folders:
global.kanban.kanbanGOInitializer = new kanbanGoInitialization.KanbanGoInitializer();

//Build geth executable:
global.kanban.kanbanGOInitializer.buildGeth();

//Initialize fabcoin folders:
fabcoinInitialization.initializeFolders();

initializeOpenCLDriver.initializeOpenCLDriver();
//<- Creates and starts the openCL driver.
//<- At the time of writing, the driver is disabled with a hard-coded flag.


buildFrontEnd.buildFrontEnd();
//<- builds the frontend javascript from source using browserify.

//console.log("DEBUG: got to here");

var serverHTTPS = https.createServer(certificateOptions.getOptions(), handleRequests.handleRequests);
serverHTTPS.listen(pathnames.ports.https, function() {
  console.log(`Listening on https port: ${pathnames.ports.https}`.green);
});

var serverHTTP = http.createServer(handleRequests.handleRequestsHTTP);
serverHTTP.listen(pathnames.ports.http, function() {
  console.log(`Listening on http port: ${pathnames.ports.http}`.yellow);
});