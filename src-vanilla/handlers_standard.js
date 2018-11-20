const url = require('url');
const queryString = require('querystring');
var ResponseWrapper = require('./response_wrapper').ResponseWrapper;

function HandlerLimits() {
  this.numberOfRequestsRunning = 0;
  this.maximumNumberOfRequestsRunning = 30;
}

var handlerLimits = new HandlerLimits();

function transformToQueryJSON(request, responseNonWrapped, callbackQuery, parsedURL) {
  var response = new ResponseWrapper(responseNonWrapped, handlerLimits);
  if (handlerLimits.numberOfRequestsRunning > handlerLimits.maximumNumberOfRequestsRunning) {
    response.writeHead(500);
    var result = {
      error: `Too many simultaneous requests running (max: ${handlerLimits.maximumNumberOfRequestsRunning}): perhaps server is overloaded? `
    };
    return response.end(JSON.stringify(result));
  }
  if (request.method === "GET") {
    return handleRPCGET(request, response, callbackQuery, parsedURL);
  }
  if (request.method === "POST") {
    return handleRPCPOST(request, response, callbackQuery, parsedURL);
  }
  response.writeHead(400);
  return response.end(`Method not implemented: ${request.method}. `);
}

function handleRPCGET(request, response, callbackQuery, parsedURL) {
  extractQuery(response, parsedURL.query, callbackQuery, parsedURL)
}

function extractQuery(response, queryNonParsed, callbackQuery, parsedURL) {
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
  callbackQuery(response, query);
}

function handleRPCPOST(request, response, callbackQuery, parsedURL) {
  let body = [];
  request.on('error', (theError) => {
    response.writeHead(400);
    response.end(`Error during message body retrieval. ${theError}`);
  }).on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    body = Buffer.concat(body).toString();
    return extractQuery(response, body, callbackQuery, parsedURL);
  });
}

module.exports = {
  transformToQueryJSON
}