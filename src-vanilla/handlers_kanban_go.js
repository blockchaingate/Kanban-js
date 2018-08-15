"use strict";
const childProcess = require('child_process');
const colors = require('colors');
const pathnames = require('./pathnames');
const escapeHtml = require('escape-html');
const http = require('http');
const initializeFabcoinFolders = require('./initialize_fabcoin_folders');

function handleRequest(request, response) {
  console.log("Handling kanban go rpc call. ");
  response.writeHead(200);
  response.end("Not implemented yet.");
}

module.exports = {
  handleRequest
}