"use strict";
const pathnames = require('./pathnames');
const assert = require('assert')
const childProcess = require('child_process');
const globals = require('./globals');
const fs = require('fs');

function fetchNodeInfo(request, response, desiredCommand) {
  fs.readFile(pathnames.pathname.configurationSecretsAdmin, function (error, data) {
    if (error) {
      response.writeHead(400);
      response.end(`Failed to open file ${pathnames.pathname.configurationSecretsAdmin}.`);
      return;
    }
    response.writeHead(200);
    response.end(data);
  });
}

module.exports = {
  fetchNodeInfo
}