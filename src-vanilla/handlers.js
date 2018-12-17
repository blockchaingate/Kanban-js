const fs = require('fs');
const mime = require('mime-types');
const escapeHtml = require('escape-html');
const url  = require('url');
const pathnames = require('./pathnames');
const handlersKanbanGo = require('./external_connections/kanbango/handlers_rpc');
const handlersKanbanGoInitialization = require('./external_connections/kanbango/handlers_initialization');
const handlersFabcoinInitialization = require('./external_connections/fabcoin/handlers_initialization');
const handlersFabcoinRPC = require('./external_connections/fabcoin/handlers_rpc');
const handlersStandard = require('./handlers_standard');
const ResponseWrapperLib = require('./response_wrapper');
const ResponseWrapper = ResponseWrapperLib.ResponseWrapper;
var responseStats = ResponseWrapperLib.responseStatsGlobal;
require('./external_connections/kanbango/handlers_my_nodes');
const handlersLogin = require('./oauth');

function handleRequestsHTTP(request, responseNonWrapped) {
  var response = new ResponseWrapper(responseNonWrapped, responseStats);
  parseTheURL(request, response, handleRequestsHTTPPart2);
}
 
function handleRequestsHTTPPart2(request, response, parsedURL) {
  responseStats.requestTypes.httpRequestsRedirectedToHttps ++;
  response.writeHead(307, {Location: `https://${parsedURL.hostname}:${pathnames.ports.https}${parsedURL.path}`});
  response.end();
}

function parseTheURL(request, response, callback) {
  if (request.url in pathnames.url.synonyms) {
    request.url = pathnames.url.synonyms[request.url];
  }
  var parsedURL = null;
  try {
    parsedURL = url.parse(request.url);
    var hostname = parsedURL.hostname;
    if (hostname === null || hostname === undefined) {
      hostname = request.headers.host;
      //console.log("hostname non-chopped: " + hostname);
      if (hostname.endsWith(`:${pathnames.ports.http}`)) {
        hostname = hostname.substring(0, hostname.length - pathnames.ports.http.toString().length - 1);
      }
      //console.log("hostname later: " + hostname);
    }  
    parsedURL.hostname = hostname;
  } catch (e) {
    responseStats.requestTypes.numberOfFailuresToParseURL ++;
    response.writeHead(400, {"Content-type": "text/plain"});
    var result = {};
    result.error = `Bad url: ${escapeHtml(e)}`;
    return response.end(JSON.stringify(result));
  }
  callback(request, response, parsedURL)
}

function handleRequests(request, responseNonWrapped) {
  var response = new ResponseWrapper(responseNonWrapped, responseStats); 
  parseTheURL(request, response, handleRequestsPart2);
}

function handleRequestsPart2(request, response, parsedURL) {
  //console.log(`DEBUG: The url is pt 2: ${request.url}`.red);
  if (parsedURL.pathname === pathnames.url.known.ping) {
    return handlePing(request, response);
  }
  if (parsedURL.pathname in pathnames.url.whiteListed) {
    //console.log(`The url is pt 3: ${request.url}`.red);
    return handleFile(request, response);
  }
  if (parsedURL.pathname === pathnames.url.known.kanbanGO.rpc) {
    return handlersStandard.transformToQueryJSON(
      request, 
      response, 
      handlersKanbanGo.handleRPCArguments,
      parsedURL,
    );
  }
  if (parsedURL.pathname === pathnames.url.known.kanbanGO.initialization) {
    var kanbanGOInitializer = handlersKanbanGoInitialization.getInitializer();
    return handlersStandard.transformToQueryJSON(
      request, 
      response,
      kanbanGOInitializer.handleRPCArguments.bind(kanbanGOInitializer),
      parsedURL,
    );
  }
  if (parsedURL.pathname === pathnames.url.known.fabcoin.rpc) {
    var fabRPCHandler = handlersFabcoinRPC.fabcoinHandlersRPC;
    return handlersStandard.transformToQueryJSON(
      request, 
      response, 
      fabRPCHandler.handleRPCArguments.bind(fabRPCHandler),
      parsedURL,
    );
  }  
  if (parsedURL.pathname === pathnames.url.known.fabcoin.initialization) {
    var fabNode = handlersFabcoinInitialization.getFabcoinNode();
    return handlersStandard.transformToQueryJSON(
      request, 
      response, 
      fabNode.handleRPCArguments.bind(fabNode),
      parsedURL,
    );
  }
  if (parsedURL.pathname === pathnames.url.known.login) {
    var oAuthGoogle = handlersLogin.oAuthGoogle;
    return handlersStandard.transformToQueryJSON(
      request, 
      response,
      oAuthGoogle.login.bind(oAuthGoogle),
      parsedURL,
    );  
  }
  //console.log(`DEBUG: The parsed url pathname is: ${parsedURL.pathname}`.red);
  response.writeHead(200);
  var result = {};
  result.error = `Uknown request ${request.url} with pathname: ${parsedURL.pathname}.`; 
  result.whiteListedURL = []; 
  for (var label in pathnames.url.whiteListed) {
    result.whiteListedURL.push(label);
  }
  response.end(JSON.stringify(result));
}

function handlePing(request, response) {
  responseStats.requestTypes.numberOfPings ++;
  response.writeHead('200', {
    'Access-Control-Allow-Origin': '*'
  });
  response.end('pong');
}

function handleFile(request, response) {
  responseStats.requestTypes.fileRequests ++;
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
