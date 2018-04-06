
var pathnames = require('./pathnames');
var fs = require('fs');
var colors = require("colors");

function handle_requests(request, response){
  //console.log(`The url is: ${request.url}`.red);
  if (request.url in pathnames.url.synonyms){
    request.url = pathnames.url.synonyms[request.url];
  }
  //console.log(`The url is pt 2: ${request.url}`.red);
  if (request.url in pathnames.url.whiteListed){
    return handleFile(request, response);
  } //else
    //console.log(`URL: ${request.url} not in: ${JSON.stringify(pathnames.url.whiteListed)}`.red);

  switch (request.url){
    case pathnames.url.faviconIco: 
      return handleFile(request, response);
    
  }
  response.writeHead(200);
  response.end("Not implemented yet");
}

function handleFile(request, response){
  fs.readFile(pathnames.url.whiteListed[request.url], function(error, data){
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
