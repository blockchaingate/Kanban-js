#!/usr/bin/env node
/**
 * Entry point for Kanban
 * 
 */

"use strict";
const pathnames = require('./pathnames');
const fs = require('fs');
const execSync = require('child_process').execSync;

function CertificateOptions() {
  this.options = {};
  this.computeCertificates();
}

////////Generate server private keys if needed
CertificateOptions.prototype.computeCertificates = function() {
  if (!fs.existsSync(pathnames.pathname.privateKey)) {
    console.log(`Private key file: ${pathnames.pathname.privateKey} appears not to exist. Let me create that for you. `);
    execSync(`openssl req -new -newkey rsa:2048 -days 3000 -nodes -x509 -subj "/C=CA/ST=ON/L=Markham/O=FA Enterprise System/CN=none" -keyout ${pathnames.pathname.privateKey} -out ${pathnames.pathname.certificate}`);
  }
  this.options = {
    cert: fs.readFileSync(pathnames.pathname.certificate),
    key: fs.readFileSync(pathnames.pathname.privateKey)
  };
}
//////////////////////////

var defaultCertificates;

module.exports = {
  CertificateOptions,
  defaultCertificates
}