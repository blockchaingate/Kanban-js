"use strict";
const childProcess = require('child_process');
const colors = require('colors');
const pathnames = require('./pathnames');
const escapeHtml = require('escape-html');
const http = require('http');
const initializeFabcoinFolders = require('./initialize_fabcoin_folders');

var numberRequestsRunning = 0;
var maxRequestsRunning = 4;
var maxLengthForCliCall = 2048; //<- messages below this length will be called using fabcoin-cli, larger messages via rpc json post. 
var totalRequests = 0;


function useFabCoinCli(request, response, theCommand, theArguments) {
  var finalData = "";
  try {

    var child = childProcess.spawn(
      theCommand, 
      theArguments
    );
    child.stdout.on('data', function(data) {
      console.log(data.toString());
      finalData += data.toString();
    });
    child.stderr.on('data', function(data) {
      console.log(data.toString());
      finalData += data.toString();
    });
    child.on('exit', function(code) {
      console.log(`RPC call exited with code: ${code}`.green);
      numberRequestsRunning --;
      if (code === 0) {
        response.writeHead(200);
        response.end(finalData);
      } else {
        response.writeHead(200);
        response.end(`{"error": "${finalData}"}`);
      }
    });
  } catch (e) {
    response.writeHead(500);
    numberRequestsRunning --;
    response.end(`Eror spawning fabcoin-cli process. ${escapeHtml(e)}. `);
    console.log(`Eror spawning process fabcoin-cli. ${e}`);
  }
}

function useRPCport(request, response, theCallLabel, desiredCommand) {
  //snippets taken from/inspired by:
  //https://github.com/freewil/node-bitcoin/blob/master/lib/jsonrpc.js 
  var errors = [];
  var RPCRequestObject = pathnames.getRPCJSON(theCallLabel, desiredCommand, `${(new Date()).getTime()}_${totalRequests}`, errors);
  if (RPCRequestObject === null) {
    response.writeHead(200);
    return response.end (`Error processing your request. ${errors[0]}`);
  }
  if (pathnames.networkData[RPCRequestObject.network].auth !== null) {
    return useRPCportPartTwo(request, response, RPCRequestObject, pathnames.networkData[RPCRequestObject.network].auth);
  }
  initializeFabcoinFolders.initializeAuthenticationCookie(
    RPCRequestObject.network, 
    useRPCportPartTwo.bind(null, request, response, RPCRequestObject)
  );
}

function useRPCportPartTwo(request, response, RPCRequestObject) {
  var requestStringified = JSON.stringify(RPCRequestObject.request);
  var authentication = pathnames.networkData[RPCRequestObject.network].auth;
  var requestOptions = {
    host: '127.0.0.1',
    port: RPCRequestObject.port,
    method: 'POST',
    path: '/',
    headers: {
      'Host': 'localhost',
      'Content-Length': requestStringified.length
    },
    auth: authentication    
    //agent: false,
    //rejectUnauthorized: this.opts.ssl && this.opts.sslStrict !== false
  };
  //console.log ("DEBUG: options for request: " + JSON.stringify(requestOptions));
  console.log ("DEBUG: and the request: " + requestStringified);
  console.log ("DEBUG: request object: " + JSON.stringify(RPCRequestObject));

  var theHTTPrequest = http.request(requestOptions);

  try {
    //console.log("DEBUG: got to here");
    theHTTPrequest.on('error', function(theError) {
      response.writeHead(500);
      numberRequestsRunning --;
      response.end(`Eror during commmunication with rpc server. ${theError}. `);
      console.log(`Eror during commmunication with rpc server. ${theError}. `);
    }); 
    theHTTPrequest.on('response', function(theHTTPresponse) {
      var finalData = "";
      //console.log("DEBUG: got response!")
      theHTTPresponse.on ('data', function (chunk) {
        finalData += chunk;
        //console.log(`DEBUG: got data chunk: ${chunk}`)
      });
      theHTTPresponse.on('error', function(yetAnotherError){
        response.writeHead(500);
        numberRequestsRunning --;
        response.end(`Eror during commmunication with rpc server. ${yetAnotherError}. `);
        //console.log(`Eror during commmunication with rpc server. ${yetAnotherError}. `);  
      });
      theHTTPresponse.on('end', function() {
        numberRequestsRunning --;
        //console.log(`DEBUG: about to respond with status code: ${theHTTPresponse.statusCode}. `)
        if (theHTTPresponse.statusCode !== 200) {
          response.writeHead(theHTTPresponse.statusCode);
          return response.end(finalData);
        }
        try {
          //console.log("DEBUG: Parsing: " + finalData + " typeof final data: " + (typeof finalData));
          var dataParsed = JSON.parse(finalData);
          if (dataParsed.error !== null && dataParsed.error !== "" && dataParsed.error !== undefined) {
            //console.log("DEBUG: Data parsed error:" + dataParsed.error);
            response.writeHead(200);
            return response.end(dataParsed.error);
          }
          response.writeHead(200);
          return response.end(JSON.stringify(dataParsed.result));
        } catch (errorParsing) {
          response.writeHead(500);
          return response.end(`Error parsing fabcoind's output: ${errorParsing}.`);
        }
      });
    });
    //console.log("DEBUG: got to before end.");
    theHTTPrequest.end(requestStringified);
  } catch (e) {
    response.writeHead(500);
    numberRequestsRunning --;
    response.end(`Eror spawning fabcoin-cli process. ${escapeHtml(e)}. `);
    console.log(`Eror spawning process fabcoin-cli. ${e}`);
  }

}

function rpcCall(request, response, desiredCommand) {
  numberRequestsRunning ++;
  if (numberRequestsRunning > maxRequestsRunning) {
    response.writeHead(500);
    numberRequestsRunning--;
    return response.end(`Too many (${numberRequestsRunning}) requests running, maximum allowed: ${maxRequestsRunning}`);
  }
  if (desiredCommand[pathnames.rpcCall] === undefined) {
    response.writeHead(400);
    numberRequestsRunning --;
    return response.end(`Request is missing the ${pathnames.rpcCall} entry. `);        
  }
  var theCallLabel = desiredCommand[pathnames.rpcCall];
  if (!(theCallLabel in pathnames.rpcCalls)) {
    response.writeHead(400);
    numberRequestsRunning --;
    return response.end(`RPC call label ${theCallLabel} not found. `);    
  }
  var totalCommandLength = 0;
  for (var label in desiredCommand) {
    totalCommandLength += desiredCommand[label].length;
  }
  var userWantsToUsePOST = false;
  if (desiredCommand[pathnames.forceRPCPOST] === true) {
    userWantsToUsePOST = true;
  }
  if (totalCommandLength > maxLengthForCliCall || userWantsToUsePOST) {
    return useRPCport(request, response, theCallLabel, desiredCommand);
  }
  
  var errors = [];
  var theArguments = pathnames.getRPCcallArguments(theCallLabel, desiredCommand, errors);
  if (theArguments === null) {
    response.writeHead(400);
    numberRequestsRunning --;
    if (errors.length > 0) {
      response.end(`{"error":"${errors[0]}"}`);
    } else {
      response.end("Error while extracting rpc call arguments. ");      
    }
    return;
  }
  var theCommand = `${pathnames.pathname.fabcoinCli}`;
  console.log(`Executing rpc command: ${theCommand}.`.blue);
  console.log(`Arguments: ${JSON.stringify(theArguments)}.`.green);
  if (theArguments.length > 10 || theArguments.length === undefined) {
    response.writeHead(200);
    return response.end(`Got ${theArguments.length} arguments: too many or too few. `);
  }
  var currentRPCNetOption = pathnames.getRPCNet(theArguments);
  var relaxSecurity = pathnames.hasRelaxedNetworkSecurity(currentRPCNetOption);
  for (var counterArguments = 0; counterArguments < theArguments.length; counterArguments ++) {
    if (theArguments[counterArguments] in pathnames.rpcCallsBannedUnlessSecurityRelaxed && !relaxSecurity) {
      response.writeHead(200);
      return response.end(`Command ${theArguments[counterArguments]} not allowed except on -regtest and -testnetnodns`);
    }
  }
  useFabCoinCli(request, response, theCommand, theArguments);
}

module.exports = {
  rpcCall
}