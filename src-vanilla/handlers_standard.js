"use strict";
const url = require('url');
const queryString = require('querystring');
var ResponseWrapper = require('./response_wrapper').ResponseWrapper;

function HandlerLimits() {
  this.numberOfRequestsRunning = 0;
  this.maximumNumberOfRequestsRunning = 30;
}

var handlerLimits = new HandlerLimits();

function transformToQueryJSON(request, responseNonWrapped, callbackQueryCommand, parsedURL) {
  var response = new ResponseWrapper(responseNonWrapped, handlerLimits);
  if (handlerLimits.numberOfRequestsRunning > handlerLimits.maximumNumberOfRequestsRunning) {
    response.writeHead(500);
    var result = {
      error: `Too many simultaneous requests running (max: ${handlerLimits.maximumNumberOfRequestsRunning}): perhaps server is overloaded? `
    };
    return response.end(JSON.stringify(result));
  }
  if (request.method === "GET") {
    return extractQuery(response, parsedURL.query, callbackQueryCommand, parsedURL);
  }
  if (request.method === "POST") {
    return handleRPCPOST(request, response, callbackQueryCommand, parsedURL);
  }
  response.writeHead(400);
  var result = {
    error: `Method not implemented: ${request.method}. `
  };
  return response.end(JSON.stringify(result));
}

function extractQuery(response, queryNonParsed, callbackQueryCommand, parsedURL) {
  var query = null;
  try {
    query = queryString.parse(queryNonParsed);
  } catch (e) {
    response.writeHead(400);
    var result = {
      error: `In handleRPCGET: bad RPC request: ${e}.`
    };
    return response.end(JSON.stringify(result));
  }
  if (query === null || query === undefined || (typeof query !== "object")) {
    response.writeHead(400);
    var result = {
      error: `Failed to parse URL in handleRPCGET.`
    };
    return response.end(JSON.stringify(result));
  }
  var hostname = parsedURL.hostname;
  query.hostname = hostname;
  var queryCommand = null;
  try {
    console.log("DEBUG: query.command is: " + query.command);
    queryCommand = JSON.parse(query.command);
    console.log("DEBUG: parsed to: " + JSON.stringify(queryCommand));
  } catch (e) {
    response.writeHead(400);
    var result = {
      error: `Bad fabcoin RPC input. ${e}`,
    };
    result.input = query;
    return response.end(JSON.stringify(result));
  }
  for (var label in query) {
    if (label in queryCommand) {
      response.writeHead(400);
      result = {
        error : `Label ${label} specified both as a query parameter and as an entry in the command json. `
      };
      return response.end(JSON.stringify(result));
    }
    queryCommand[label] = query[label];
  }
  callbackQueryCommand(response, queryCommand);
}

function handleRPCPOST(request, response, callbackQueryCommand, parsedURL) {
  let body = [];
  request.on('error', (theError) => {
    response.writeHead(400);
    response.end(`Error during message body retrieval. ${theError}`);
  }).on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    body = Buffer.concat(body).toString();
    return extractQuery(response, body, callbackQueryCommand, parsedURL);
  });
}

module.exports = {
  transformToQueryJSON
}