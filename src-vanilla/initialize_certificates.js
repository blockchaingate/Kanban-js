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
  this.computeCertificates();
}

////////Generate server private keys if needed
CertificateOptions.prototype.generatePrivateKeyIfNeeded = function() {
  if (!fs.existsSync(pathnames.pathname.privateKey)) {
    console.log(`Private key file: ` + `${pathnames.pathname.privateKey}`.red + ` appears not to exist. Let me create that for you. `);
    execSync(`openssl req -new -newkey rsa:2048 -days 3000 -nodes -x509 -subj "/C=CA/ST=ON/L=Markham/O=FA Enterprise System/CN=none" -keyout ${pathnames.pathname.privateKey} -out ${pathnames.pathname.certificate}`);
  }
}

CertificateOptions.prototype.computeCertificates = function() {
  var configuration = configurationContainer.getConfiguration();
  if (configuration.configuration.useCertbot === true) {
    pathnames.pathname.certificate = configuration.configuration.certbotCertificateFileName;
    pathnames.pathname.privateKey = configuration.configuration.certbotPrivateKeyFileName;
    childProcess.exec(`certbot --pre-hook "sudo service ngnix stop" --post-hook "sudo nginx start"`, this.computeCertificatesPart2.bind(this));
  } else {
    this.generatePrivateKeyIfNeeded();
    this.computeCertificatesPart2();
  }
}

CertificateOptions.prototype.computeCertificatesPart2 = function() {
  this.options = {
    cert: fs.readFileSync(pathnames.pathname.certificate),
    key: fs.readFileSync(pathnames.pathname.privateKey)
  };
}
//////////////////////////

module.exports = {
  CertificateOptions,
  getOptions
}