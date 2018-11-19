const url = require('url');
const queryString = require('querystring');
var ResponseWrapper = require('./response_wrapper').ResponseWrapper;

function HandlerLimits() {
  this.numberOfRequestsRunning = 0;
  this.maximumNumberOfRequestsRunning = 30;
}

var handlerLimits = new HandlerLimits();

function transformToQueryJSON(request, responseNonWrapped, callbackQuery) {
  var response = new ResponseWrapper(responseNonWrapped, handlerLimits);
  if (handlerLimits.numberOfRequestsRunning > handlerLimits.maximumNumberOfRequestsRunning) {
    response.writeHead(500);
    var result = {
      error: `Too many simultaneous requests running (max: ${handlerLimits.maximumNumberOfRequestsRunning}): perhaps server is overloaded? `
    };
    return response.end(JSON.stringify(result));
  }

  if (request.method === "GET") {
    return handleRPCGET(request, response, callbackQuery);
  }
  if (request.method === "POST") {
    return handleRPCPOST(request, response, callbackQuery);
  }
  response.writeHead(400);
  return response.end(`Method not implemented: ${request.method}. `);
}

function handleRPCGET(request, response, callbackQuery) {
  var parsedURLobject = null;
  try {
    parsedURLobject = url.parse(request.url);
    //console.log(`DEBUG: parsed url object: ${JSON.stringify(parsedURLobject)}`)
  } catch (e) {
    response.writeHead(400);
    return response.end(`In handleRPCGET: bad RPC request: ${e}.`);
  }
  if (parsedURLobject === null || parsedURLobject === undefined) {
    return response.end(`Failed to parse URL in handleRPCGET.`)
  }
  extractQuery(response, parsedURLobject.query, callbackQuery)
}

function extractQuery(response, parsedURL, callbackQuery) {
  var query = null;
  try {
    query = queryString.parse(parsedURL);
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
  callbackQuery(response, query);
}

function handleRPCPOST(request, response, callbackQuery) {
  let body = [];
  request.on('error', (theError) => {
    response.writeHead(400);
    response.end(`Error during message body retrieval. ${theError}`);
  }).on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    body = Buffer.concat(body).toString();
    return extractQuery(response, body, callbackQuery);
  });
}

module.exports = {
  transformToQueryJSON
}