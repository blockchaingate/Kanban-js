function getQueryStringFromRequest(request, response, callbackToPassQueryStringTo) {
  if (request.method === "GET") {
    return handleRPCGET(request, response, callbackToPassQueryStringTo);
  }
  if (request.method === "POST") {
    return handleRPCPOST(request, response);
  }
  response.writeHead(400);
  return response.end(`Method not implemented: ${request.method}. `);
}

function handleRPCGET(request, response, callbackToPassQueryStringTo) {
  var parsedURL = null;
  try {
    parsedURL = url.parse(request.url);
  } catch (e) {
    response.writeHead(400);
    return response.end(`In handleRPCGET: bad RPC request: ${e}.`);
  }
  if (parsedURL === null || parsedURL === undefined) {
    return response.end(`Failed to parse URL in handleRPCGET.`)
  }
  callbackToPassQueryStringTo(response, parsedURL);
}

function handleRPCPOST(request, response, callbackToPassQueryStringTo) {
  let body = [];
  request.on('error', (theError) => {
    response.writeHead(400);
    response.end(`Error during message body retrieval. ${theError}`);
  }).on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    body = Buffer.concat(body).toString();
    return callbackToPassQueryStringTo(response, body);
  });
}

module.exports = {
  getQueryStringFromRequest
}