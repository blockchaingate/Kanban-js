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

var stringSubstitutions = {
  "${projectBase}": pathnames.path.base,
};

function Configuration () {
  //defaults below. The defaults are overridden by this.readSecretsAdmin();
  //which reads config.json from pathnames.path.configurationSecretsAdmin
  this.labelsToRead = {
    kanbanGO: true,
    myNodes: true,
    fabcoin: true,
  }
  this.kanbanGO = {
    gethFolder: "uninitialized",
    dataDirName: "secrets_data_kanban_go"
  }
  this.fabcoin = {
    executable: `${pathnames.path.base}/fabcoin-dev-sm01/src/fabcoind`,
    dataDir: `${pathnames.path.base}/secrets_data_fabcoin`
  };
  this.myNodes = {};

}

Configuration.prototype.processString = function(/**@type {string}*/ inputString) {
  for (var label in stringSubstitutions) {
    var subStart = inputString.indexOf(label);
    if (subStart === - 1) {
      continue;
    }
    var replacement = stringSubstitutions[label];
    var resultString = inputString.slice(0, subStart) + replacement + inputString.slice(
      subStart + label.length
    );
    console.log("DEBUG: result string is: " + resultString);
    // after first successful substituion we return immediately: one substituion per input
    return resultString;
  }
  console.log("DEBUG: result string is: " + inputString);
  return inputString;
}

Configuration.prototype.readRecursively = function (base, label, input) {
  console.log("DEBUG: About to process: label: " + label);
  if (typeof input === "string") {
    base[label] = this.processString(input);
    return;
  }
  if (typeof input === "number") {
    base[label] = input;
    return;
  }
  if (typeof input !== "object") {
    console.log(`Error: don't know how to read: ${input}`.red);
    return;
  }
  if (base[label] === undefined) {
    base[label] = {};
  }
  for (var newLabel in input) {
    this.readRecursively(base[label], newLabel, input[newLabel]);
  }
}

Configuration.prototype.readSecretsAdminCallback = function(err, data) {
  try {
    console.log(`Configuration file name: ` + `${pathnames.pathname.configurationSecretsAdmin}`.blue);
    //console.log(`DEBUG: config content: ` + `${data}`.blue);
    var contentParsed = JSON.parse(data);
    //console.log(`DEBUG: content read: ${data}`);
    for (var label in this.labelsToRead) {
      if (label in contentParsed) {
        this.readRecursively(this, label, contentParsed[label]);
      }
    }
  } catch (e) {
    console.log(`Failed to read file: ${pathnames.pathname.configurationSecretsAdmin}. Error: ${e}`.red);
  }
}

//Reads json entries from config.json in pathnames.path.configurationSecretsAdmin
//and attaches them to the this object
Configuration.prototype.readSecretsAdmin = function() {
  var data = fs.readFileSync(pathnames.pathname.configurationSecretsAdmin);
  this.readSecretsAdminCallback(null, data);
}

module.exports = {
  Configuration,
  getConfiguration
}