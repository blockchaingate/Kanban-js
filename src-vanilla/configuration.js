#!/usr/bin/env node
/**
 * Entry point for Kanban
 * 
 */

"use strict";
const pathnames = require('./pathnames');
const fs = require('fs');

function getConfiguration() {
  return global.kanban.configuration;
}

function Configuration () {
  //defaults below. The defaults are overridden by this.readSecretsAdmin();
  //which reads config.json from pathnames.path.configurationSecretsAdmin
  this.labelsToRead = {
    kanbanGO: true,
    myNodes: true
  }
  this.kanbanGO = {
    gethFolder: "uninitialized",
    dataDirName: "secrets_data_kanban_go"
  }
  this.myNodes = {};

  this.readSecretsAdmin(); 
  //<- reads json entries from config.json in pathnames.path.configurationSecretsAdmin
  //<- and attaches them to the this object
}

Configuration.prototype.readSecretsAdminCallback = function(err, data) {
  try {
    console.log(`Configuration file name: ` + `${pathnames.pathname.configurationSecretsAdmin}`.blue);
    console.log(`DEBUG: config content: ` + `${data}`.blue);
    var contentParsed = JSON.parse(data);
    //console.log(`DEBUG: content read: ${data}`);
    for (var label in this.labelsToRead) {
      if (label in contentParsed) {
        this[label] = Object.assign({}, contentParsed[label]);
      }
    }
  } catch (e) {
    console.log(`Failed to read file: ${pathnames.pathname.configurationSecretsAdmin}. `.red);
  }
}

Configuration.prototype.readSecretsAdmin = function() {
  var data = fs.readFileSync(pathnames.pathname.configurationSecretsAdmin);
  this.readSecretsAdminCallback(null, data);
}

module.exports = {
  Configuration,
  getConfiguration
}