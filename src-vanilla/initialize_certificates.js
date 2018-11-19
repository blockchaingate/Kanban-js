#!/usr/bin/env node
/**
 * Entry point for Kanban
 * 
 */

"use strict";
const pathnames = require('./pathnames');
const fs = require('fs');
const childProcess = require('child_process'); 
const execSync = childProcess.execSync;
const configurationContainer = require('./configuration');

function getOptions() {
  return global.kanban.certificateOptions.options;
}

function CertificateOptions() {
  this.options = {};
}

////////Generate server private keys if needed
CertificateOptions.prototype.generatePrivateKeyIfNeeded = function(callback) {
  if (!fs.existsSync(pathnames.pathname.privateKey)) {
    console.log(`Private key file: ` + `${pathnames.pathname.privateKey}`.red + ` appears not to exist. Let me create that for you. `);
    execSync(`openssl req -new -newkey rsa:2048 -days 3000 -nodes -x509 -subj "/C=CA/ST=ON/L=Markham/O=FA Enterprise System/CN=none" -keyout ${pathnames.pathname.privateKey} -out ${pathnames.pathname.certificate}`);
  }
  this.computeCertificatesPart2(callback);
}

CertificateOptions.prototype.computeCertificates = function(callback) {
  var configuration = configurationContainer.getConfiguration();
  //console.log("DEBUG: got to here");
  if (configuration.configuration.useCertbot === true) {
    pathnames.pathname.certificate = configuration.configuration.certbotCertificateFileName;
    pathnames.pathname.privateKey = configuration.configuration.certbotPrivateKeyFileName;
    //console.log(`About to renew certificate. ` + `Please stop any servers listening to port 80. `.red);
    var workDir = configuration.configuration.certbotConfigDir;
    childProcess.exec(
      `certbot renew --config-dir ${workDir} --work-dir ${workDir} --logs-dir ${workDir}`, 
      this.computeCertificatesPart2.bind(this, callback),
    );
  } else {
    this.generatePrivateKeyIfNeeded(callback);
  }
}

CertificateOptions.prototype.computeCertificatesPart2 = function(callback) {
  //console.log("DEBUG: Got to before loading the files. ");
  this.options = {
    cert: fs.readFileSync(pathnames.pathname.certificate),
    key: fs.readFileSync(pathnames.pathname.privateKey)
  };
  //console.log("DEBUG: Loaded certificates successfully: " + JSON.stringify(this.options));
  callback();
}
//////////////////////////

module.exports = {
  CertificateOptions,
  getOptions
}