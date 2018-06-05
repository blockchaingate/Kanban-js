const pathnames = require('./pathnames');
const fs = require('fs');
const colors = require('colors');
const mime = require('mime-types');
const escapeHtml = require('escape-html');
const queryString = require('querystring');
const url  = require('url');
const fabCli = require('./fabcoin_cli_call');
const fabcoinInitialization = require('./fabcoin_initialization');
const nodeHandlers = require('./node_handlers');

function handle_requests(request, response){
  //console.log(`The url is: ${request.url}`.red);
  if (request.url in pathnames.url.synonyms){
    request.url = pathnames.url.synonyms[request.url];
  }
  var parsedURL = null;
  try {
    parsedURL = url.parse(request.url);
  } catch (e) {
    response.writeHead(400, {"Content-type": "text/plain"});
    return response.end(`Bad url: ${escapeHtml(e)}`);
  }
  //console.log(`DEBUG: The url is pt 2: ${request.url}`.red);
  if (parsedURL.pathname in pathnames.url.whiteListed){
    //console.log(`The url is pt 3: ${request.url}`.red);
    return handleFile(request, response);
  }
  if (parsedURL.pathname === pathnames.url.known.fabcoinInitialization){
    return handleFabcoinInitialization(request, response);
  }
  if (parsedURL.pathname === pathnames.url.known.rpc){
    return handleRPC(request, response);
  }
  if (parsedURL.pathname === pathnames.url.known.node){
    return handleNodeCall(request, response);
  }
  
  //console.log(`DEBUG: The url is pt 5: ${request.url}`.red);
  response.writeHead(200);
  response.end(`Uknown request ${escapeHtml(request.url)}`);
}

function handleFabcoinInitialization(request, response){
  var parsedURL = null;
  var query = null;
  var queryCommand = null;
  try {
    parsedURL = url.parse(request.url);
    query = queryString.parse(parsedURL.query);
    queryCommand = JSON.parse(query.command);
  } catch (e) {
    response.writeHead(400);
    return response.end(`Bad fab coin initialization request: ${e}`);
  }
  return fabcoinInitialization.fabcoinInitialize(request, response, queryCommand);
}

function handleRPC(request, response){
  var parsedURL = null;
  var query = null;
  var queryCommand = null;
  try {
    parsedURL = url.parse(request.url);
    query = queryString.parse(parsedURL.query);
    queryCommand = JSON.parse(query.command);
  } catch (e) {
    response.writeHead(400);
    return response.end(`Bad RPC request: ${e}`);
  }
  return fabCli.rpcCall(request, response, queryCommand);
}

function handleNodeCall(request, response){
  var parsedURL = null;
  var query = null;
  var queryCommand = null;
  try {
    parsedURL = url.parse(request.url);
    query = queryString.parse(parsedURL.query);
    queryCommand = JSON.parse(query.command);
  } catch (e) {
    response.writeHead(400);
    return response.end(`Bad node call request: ${e}`);
  }
  return nodeHandlers.dispatch(request, response, queryCommand);
}

function handleFile(request, response){
  var thePathName = pathnames.url.whiteListed[request.url];
  fs.readFile(thePathName, function(error, data){
    if (error){
      response.writeHead(400, `File error.`);
      response.end(`While fetching: ${escape(request.url)} got the error: ${error}. `);
      return;
    }
    var mimeType = mime.lookup(thePathName);
    if (!mimeType){
      mimeType = "application/x-binary";
    }
    response.writeHead(200, {"Content-type": mimeType});
    response.end(data);
  });
}

module.exports = {
  handle_requests
}
