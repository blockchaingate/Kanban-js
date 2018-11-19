const fs = require('fs');
const colors = require('colors');
const mime = require('mime-types');
const escapeHtml = require('escape-html');
const queryString = require('querystring');
const url  = require('url');
const pathnames = require('./pathnames');
const handlersComputationalEngine = require('./external_connections/other/cpp_engine');
const handlersKanbanGo = require('./external_connections/kanbango/handlers_rpc');
const handlersKanbanGoInitialization = require('./external_connections/kanbango/handlers_initialization');
const handlersFabcoinInitialization = require('./external_connections/fabcoin/handlers_initialization');
const handlersFabcoinRPC = require('./external_connections/fabcoin/handlers_rpc');

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
  if (parsedURL.pathname === pathnames.url.known.kanbanGO.rpc) {
    return handlersKanbanGo.handleRequest(request, response);
  }
  if (parsedURL.pathname === pathnames.url.known.kanbanGO.initialization) {
    return handlersKanbanGoInitialization.getInitializer().handleRequest(request, response);
  }
  if (parsedURL.pathname === pathnames.url.known.fabcoin.rpc) {
    return handlersFabcoinRPC.handleRequest(request, response);
  }  
  if (parsedURL.pathname === pathnames.url.known.fabcoin.initialization) {
    return handlersFabcoinInitialization.getFabcoinNode().handleRequest(request, response);
  }
  //console.log(`DEBUG: The parsed url pathname is: ${parsedURL.pathname}`.red);
  response.writeHead(200);
  response.end(`Uknown request ${request.url} with pathname: ${parsedURL.pathname}.`);
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
