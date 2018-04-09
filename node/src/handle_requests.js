const pathnames = require('./pathnames');
const fs = require('fs');
const colors = require('colors');
const mime = require('mime-types');
const escapeHtml = require('escape-html');
const queryString = require('querystring');
var url  = require('url');

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
  //console.log(`The url is pt 2: ${request.url}`.red);
  if (parsedURL.pathname in pathnames.url.whiteListed){
    //console.log(`The url is pt 3: ${request.url}`.red);
    return handleFile(request, response);
  }
  if (parsedURL.pathname === pathnames.url.known.rpc){
    return handleRPC(request, response);
  }
  response.writeHead(200);
  response.end(`Uknown request ${escapeHtml(request.url)}`);
}

function handleRPC(request, response){
  var parsedURL = null;
  var query = null;
  var queryCommand = null;
  try {
    parsedURL = url.parse(request.url);
    query = queryString.parse(parsedURL.query);
    queryCommand = JSON.parse(query[pathnames.rpc.command]);
  } catch (e) {
    response.writeHead(400);
    return response.end(`Bad rpc request: ${escapeHtml(e)}`);
  }
  switch (queryCommand[pathnames.rpc.command]){

    default:
      response.writeHead(200);
      var command = escapeHtml(JSON.stringify(queryCommand[pathnames.rpc.command]));
      var commandQuery = escapeHtml(JSON.stringify(queryCommand));
      return response.end(`Don't know how to interpret command: ${command} extracted from query: ${commandQuery}.`);
  }
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
