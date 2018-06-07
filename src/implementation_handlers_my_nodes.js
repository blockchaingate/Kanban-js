"use strict";
const pathnames = require('./pathnames');
const assert = require('assert')
const childProcess = require('child_process');
const globals = require('./globals');

function fetchNodeInfo(request, response, desiredCommand) {
  response.writeHead(200);
  return response.end("fetch node info not implemented yet");
}

module.exports = {
  fetchNodeInfo
}