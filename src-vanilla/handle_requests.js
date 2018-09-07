const pathnames = require('./pathnames');
const fs = require('fs');
const colors = require('colors');
const mime = require('mime-types');
const escapeHtml = require('escape-html');
const queryString = require('querystring');
const url  = require('url');
const fabCli = require('./handlers_fabcoin_cli');
const fabcoinInitialization = require('./handlers_fabcoin_initialization');
const handlersComputationalEngine = require('./handlers_computational_engine');
const handlersMyNodes = require('./handlers_my_nodes');
const handlersKanbanGo = require('./handlers_kanban_go');
const handlersKanbanGoInitialization = require('./handlers_kanban_go_initialization');

function handleRequestsHTTP(request, response) {
  if (request.url in pathnames.url.synonyms) {
    request.url = pathnames.url.synonyms[request.url];
  }
  var parsedURL = null;
  try {
    parsedURL = url.parse(request.url);
  } catch (e) {
    response.writeHead(400, {"Content-type": "text/plain"});
    return response.end(`Bad url: ${escapeHtml(e)}`);
  }
  if (parsedURL.pathname === pathnames.url.known.ping) {
    return handlePing(request, response);
  }
  var hostname = parsedURL.hostname; 
  //  console.log(hostname);
  if (hostname === null || hostname === undefined) {
    hostname = request.headers.host;
    //console.log("hostname non-chopped: " + hostname);
    if (hostname.endsWith(`:${pathnames.ports.http}`)) {
      hostname = hostname.substring(0, hostname.length - pathnames.ports.http.toString().length - 1);
    }
    //console.log("hostname later: " + hostname);
  }
  response.writeHead(307, {Location: `https://${hostname}:${pathnames.ports.https}${parsedURL.path}`});
  response.end();
}

function handleRequests(request, response) {
  //console.log(`The url is: ${request.url}`.red);
  if (request.url in pathnames.url.synonyms) {
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
  if (parsedURL.pathname === pathnames.url.known.ping) {
    return handlePing(request, response);
  }
  if (parsedURL.pathname in pathnames.url.whiteListed) {
    //console.log(`The url is pt 3: ${request.url}`.red);
    return handleFile(request, response);
  }
  if (parsedURL.pathname === pathnames.url.known.fabcoinInitialization) {
    return handleFabcoinInitialization(request, response);
  }
  if (parsedURL.pathname === pathnames.url.known.myNodesCommand) {
    return handleMyNodesCall(request, response);
  }
  if (parsedURL.pathname === pathnames.url.known.rpc) {
    return handleRPC(request, response, false);
  }
  if (parsedURL.pathname === pathnames.url.known.kanbanRPC) {
    return handleRPC(request, response, true);
  }
  if (parsedURL.pathname === pathnames.url.known.goKanbanRPC) {
    return handlersKanbanGo.handleRequest(request, response);
  }
  if (parsedURL.pathname === pathnames.url.known.kanbanInitialization) {
    return handlersKanbanGoInitialization.getInitializer().handleRequest(request, response);
  }
  if (parsedURL.pathname === pathnames.url.known.computationEngine) {
    return handleComputationalEngineCall(request, response);
  }  
  //console.log(`DEBUG: The parsed url pathname is: ${parsedURL.pathname}`.red);
  response.writeHead(200);
  response.end(`Uknown request ${escapeHtml(request.url)}`);
}

function handleFabcoinInitialization(request, response) {
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

function handleRPC(request, response, isKanban) {
  //if (isKanban) {
  //  console.log(`DEBUG: handling Kanban request`.cyan);
  //}
  if (request.method === "POST") {
    return handleRPCPOST(request, response, isKanban);
  }
  if (request.method === "GET") {
    return handleRPCGET(request, response, isKanban);
  }
  response.writeHead(400);
  response.end(`Uknown/unhandled request method: ${request.method}`);
}

function handleRPCPOST(request, response, isKanban) {
  let body = [];
  request.on('error', (err) => {
    response.writeHead(400);
    response.end(`Error during message body retrieval. ${err}`);
  }).on('data', (chunk) => {
    body.push(chunk);
  }).on('end', () => {
    body = Buffer.concat(body).toString();
    return handleRPCURLEncodedInput(request, response, body, isKanban);
  });
}

function handleRPCGET(request, response, isKanban) {
  var parsedURL = null;
  try {
    parsedURL = url.parse(request.url);
  } catch (e) {
    response.writeHead(400);
    return response.end(`Bad RPC request: ${e}`);
  }
  return handleRPCURLEncodedInput(request, response, parsedURL.query, isKanban);
}

function handleRPCURLEncodedInput(request, response, urlEncodedInput, isKanban) {
  var query = null;
  var queryCommand = null;
  try {
    query = queryString.parse(urlEncodedInput);
    queryCommand = JSON.parse(query.command);
  } catch (e) {
    response.writeHead(400);
    return response.end(`Bad RPC input. ${e}`);
  }
  return fabCli.rpcCall(request, response, queryCommand, isKanban);
}

function handleComputationalEngineCall(request, response) {
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
  return handlersComputationalEngine.dispatch(request, response, queryCommand);
}

function handleMyNodesCall(request, response) {
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
  return handlersMyNodes.myNodeCall(request, response, queryCommand);
}

function handlePing(request, response) {
  response.writeHead('200', {
    'Access-Control-Allow-Origin': '*'
  });
  response.end('pong');
}

function handleFile(request, response) {
  var thePathName = pathnames.url.whiteListed[request.url];
  var mimeType = mime.lookup(thePathName);
  if (!mimeType) {
    mimeType = "application/x-binary";
  }
  var theFileSender = fs.createReadStream(thePathName, {highWaterMark: 1024 * 512});
  //console.log("Created filesender");
  var headerWritten = false;
  var numBlocksSent = 0;
  theFileSender.on("data", function(data) {
    //console.log(`File block index: ${numBlocksSent}` );
    numBlocksSent ++;
    if (!headerWritten) {
      response.writeHead(200, {"Content-type": mimeType});
      headerWritten = true;
    }
    response.write(data);
  });
  theFileSender.on('close', function(){
    //console.log("Got exit");
    response.end();
  });
  theFileSender.on('error', function(error) {
    //console.log("Got error");
    if (!headerWritten) {
      response.writeHead(400, `File error.`);
      headerWritten = true;
    }
    response.end(`While fetching: ${escape(request.url)} got the error: ${error}. `);
    theFileSender.close();
  });
}

module.exports = {
  handleRequests,
  handleRequestsHTTP
}
