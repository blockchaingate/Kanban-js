const url  = require('url');
const queryString = require('querystring');
const miscellaneousBackend = require('./miscellaneous');

function getQueryStringFromRequest(request, response, callbackQuery) {
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
    //console.log(`DEBUG: parsed url: ${JSON.stringify(parsedURL)}`)
  } catch (e) {
    response.writeHead(400);
    return response.end(`In handleRPCGET: bad RPC request: ${e}.`);
  }
  if (query === null || query === undefined) {
    response.writeHead(400);
    return response.end(`Failed to parse URL in handleRPCGET.`);
  }
  callbackQuery(response, query, callbackQuery);
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
  getQueryStringFromRequest
}