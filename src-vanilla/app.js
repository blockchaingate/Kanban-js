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
const handleRequests = require('./handlers'); 
const kanbanGoInitialization = require('./external_connections/kanbango/handlers_initialization');
const fabcoinOLDInitialization = require('./initialize_fabcoin_old_folders');
const fabcoinInitialization = require('./external_connections/fabcoin/handlers_initialization');

var FabcoinNode = fabcoinInitialization.FabcoinNode;
var KanbanGoInitializer = kanbanGoInitialization.KanbanGoInitializer; 

/**Handlers for various configurations*/
global.kanban = {
  /**@type {Configuration} */
  configuration: null,
  certificateOptions: null,
  /**@type {KanbanGoInitializer} */ 
  kanbanGOInitializer: null,
  /**@type {FabcoinNode} */
  fabcoinNode: null,
  jobs: null,
  openCLDriver: null
};
//The initialization order matters: some initializations depend on the previous ones. 
//Most initializations depend on 
//global.kanban.configuration

//Server general configuration, allocate:
global.kanban.configuration = new configuration.Configuration();

//Read configuration from secreta_admin/configuration.json:
global.kanban.configuration.readSecretsAdmin();

//Server ssl certificates:
global.kanban.certificateOptions = new certificateOptions.CertificateOptions();

//Create kanban go manager:
global.kanban.kanbanGOInitializer = new kanbanGoInitialization.KanbanGoInitializer();

//Compute kanban go folders:
global.kanban.kanbanGOInitializer.computePaths();

//Build geth executable:
global.kanban.kanbanGOInitializer.killGethBuildGeth();

//Create fabcoin node container:
//The fabcoin folders are taken from global.configuration.fabcoin
global.fabcoinNode = new FabcoinNode();

//Initialize old fabcoin folders:
fabcoinOLDInitialization.initializeFolders();

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