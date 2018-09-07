"use strict";
const jobs = require('./jobs');
const openCLDriver = require('./open_cl_driver');

function initializeOpenCLDriver() {
  global.kanban = {
    openCLDriver: new openCLDriver.OpenCLDriver(),
    jobs: new jobs.Jobs()
  };
  console.log(`The OpenCL driver is disabled from source code (file ${__filename}).`.blue);
  global.kanban.openCLDriver.enabled = false;
  global.kanban.openCLDriver.startAndConnect();
}

module.exports = {
  initializeOpenCLDriver
}

