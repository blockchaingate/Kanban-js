
var pathnames = require('./pathnames');
var fs = require('fs');

function handle_requests(request, response){
  response.writeHead(200);
  if (request.url in pathnames.url.whiteListedFiles){
    return handleFile(request, response);
  }

  switch (request.url){
    case pathnames.url.faviconIco: 
      return handleFile(request, response);
    
  }
  response.end("Not implemented yet");
}

function handleFile(request, response){
  fs.readFile(pathnames.url.whiteListedFiles[request.url], function(error, data){
    if (error){
      response.writeHead(400, `File error.`);
      response.end(`While fetching: ${escape(request.url)} got the error: ${error}. `);
      return;
    }
    response.writeHead(200);
    response.end(data);
  });
}

module.exports = {
  handle_requests
}
