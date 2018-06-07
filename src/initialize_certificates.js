#!/usr/bin/env node
/**
 * Entry point for Kanban
 * 
 */

"use strict";
const pathnames = require('./pathnames');
const path = require('path');
const https = require('https');
const http = require('http');
const openCLDriver = require('./open_cl_driver');
const jobs = require('./jobs');
////////Initialize the openCL driver
global.kanban = {
  openCLDriver: new openCLDriver.OpenCLDriver(),
  jobs: new jobs.Jobs()
};
///////////////////////////////
const handleRequests = require('./handle_requests');
const fs = require('fs');
const execSync = require('child_process').execSync;
const colors = require('colors');
const buildFrontEnd = require('./build_frontend');
const fabcoinInitializeFolders = require('./initialize_fabcoin_folders');


////////Generate server private keys if needed
function getCertificateOptions() {
  if (!fs.existsSync(pathnames.pathname.privateKey)) {
    console.log(`Private key file: ${pathnames.pathname.privateKey} appears not to exist. Let me create that for you. Answer all prompts please (enter for defaults). `);
    execSync(`openssl req -new -newkey rsa:2048 -days 3000 -nodes -x509 -subj "/C=CA/ST=ON/L=Markham/O=FA Enterprise System/CN=none" -keyout ${pathnames.pathname.privateKey} -out ${pathnames.pathname.certificate}`);
  }

  var options = {
    cert: fs.readFileSync(pathnames.pathname.certificate),
    key: fs.readFileSync(pathnames.pathname.privateKey)
  };
  return options;
}
//////////////////////////

module.exports = {
  getCertificateOptions
}