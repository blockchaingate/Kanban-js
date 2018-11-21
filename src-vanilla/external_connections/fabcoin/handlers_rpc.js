"use strict";
const http = require('http');
const fabcoinRPC = require('./rpc');
const fabcoinInitializationSpec = require('./initialization');
const fabcoinInitialization = require('./handlers_initialization');

function handleQuery(response, query) {
  var queryCommand = null;
  var queryNode = null;
  try {
    queryCommand = JSON.parse(query.command);
    queryNode = JSON.parse(query[fabcoinRPC.urlStrings.command]);    
  } catch (e) {
    response.writeHead(400);
    return response.end(`Bad fabcoin RPC input: ${JSON.stringify(query)}. ${e}`);
  }
  return handleRPCArguments(response, queryCommand, queryNode);
}

var numberRequestsRunning = 0;
var maxRequestsRunning = 20;

function getRPCRequestJSON(rpcCallLabel, queryCommand, errors) {
  /**@type {{rpcCall: string, method: string, mandatoryFixedArguments: Object,  mandatoryModifiableArguments: Object,  optionalArguments: Object, allowedArgumentValues: Object, parameters: string[]}}*/
  var currentRPCCall = fabcoinRPC.rpcCalls[rpcCallLabel];
  var currentParameters = [];
  for (var counterCommands = 0; counterCommands < currentRPCCall.parameters.length; counterCommands ++) {
    var currentParameterName = currentRPCCall.parameters[counterCommands];
    if (currentRPCCall.mandatoryFixedArguments !== null && currentRPCCall.mandatoryFixedArguments !== undefined) {
      if (currentParameterName in currentRPCCall.mandatoryFixedArguments) {
        currentParameters.push(currentRPCCall.mandatoryFixedArguments[currentParameterName]);
        continue;
      }
    }
    if (currentParameterName in queryCommand) {
      var incomingParameter = queryCommand[currentParameterName];
      currentParameters.push(incomingParameter);
      continue;
    }
    if (currentRPCCall.optionalArguments !== undefined && currentRPCCall.optionalArguments !== null) {
      var currentDefault = currentRPCCall.optionalArguments[currentParameterName];
      if (currentDefault !== undefined && currentDefault !== null) {
        currentParameters.push(currentDefault);
        continue;
      }
    }
    if (currentRPCCall.mandatoryModifiableArguments !== undefined && currentRPCCall.mandatoryModifiableArguments !== null) {
      if (currentParameterName in currentRPCCall.mandatoryModifiableArguments) {
        var defaultValue = currentRPCCall.mandatoryModifiableArguments[currentParameterName]; 
        if (defaultValue !== null && defaultValue !== undefined) {
          currentParameters.push(defaultValue);
          continue;
        }
        errors.push(`Missing parameter ${currentParameterName} in method ${rpcCallLabel}.`);
        return {};
      }
      var currentDefault = currentRPCCall.mandatoryModifiableArguments[currentParameterName];
      if (currentDefault !== null && currentDefault !== undefined) {
        currentParameters.push(currentDefault);
        continue;
      }
    }
  }
  var result = {
    jsonrpc: "2.0",
    method: currentRPCCall.method,
    params: currentParameters,
    id : (new Date()).getTime() //<- not guaranteed to be unique
  };
  return result;
}

function handleRPCArguments(response, queryCommand) {
  numberRequestsRunning ++;
  if (numberRequestsRunning > maxRequestsRunning) {
    response.writeHead(500);
    numberRequestsRunning --;
    var result = {
      error: `Too many (${numberRequestsRunning}) requests running, maximum allowed: ${maxRequestsRunning}`
    };
    return response.end(JSON.stringify(result));
  }
  try {
    if (queryCommand[fabcoinRPC.urlStrings.rpcCallLabel] === undefined) {
      response.writeHead(400);
      numberRequestsRunning --;
      var result = {
        error: `Command is missing the ${fabcoinRPC.urlStrings.rpcCallLabel} entry. `
      };
      return response.end(JSON.stringify(result));        
    }
  } catch (e) {
    response.writeHead(400);
    numberRequestsRunning --;
    var result = {
      error: `Failed to extract rpc call label. ${e}`
    };
    return response.end(JSON.stringify(result));        
  }
  var theCallLabel = queryCommand[fabcoinRPC.urlStrings.rpcCallLabel];
  var callCollection = fabcoinRPC.rpcCalls;
  if (!(theCallLabel in callCollection)) {
    response.writeHead(400);
    numberRequestsRunning --;
    var result = {
      error: `RPC call label ${theCallLabel} not found. `
    };
    return response.end(JSON.stringify(result));    
  }
  var errors = [];
  var theRequestJSON = getRPCRequestJSON(theCallLabel, queryCommand, errors);
  if (errors.length > 0) {
    response.writeHead(400);
    numberRequestsRunning --;
    return response.end(JSON.stringify({error: errors[0]}));
  }
  if (!fabcoinInitialization.getFabcoinNode().flagStartWasEverAttempted) {
    numberRequestsRunning --;
    fabcoinInitialization.getFabcoinNode().flagStartWasEverAttempted = true;
    response.writeHead(200);
    var result = {
      error: fabcoinInitializationSpec.urlStrings.errorFabNeverStarted
    };
    response.end(JSON.stringify(result));
    return;
  }

  //console.log("DEBUG: request stringified: " + JSON.stringify(theRequestJSON));
  var requestStringified = JSON.stringify(theRequestJSON);
  
  return handleRPCArgumentsPartTwo(response, requestStringified);
}

function handleRPCArgumentsPartTwo(response, requestStringified) {
  var theNode = fabcoinInitialization.getFabcoinNode();
  var requestOptions = {
    host: '127.0.0.1',
    port: theNode.configuration.RPCPort,
    method: "POST",
    path: '/',
    headers: {
      'Host': 'localhost',
      'Content-Length': requestStringified.length,
      'Content-Type': 'application/json'
    },
    auth: `${theNode.configuration.RPCUser}:${theNode.configuration.RPCPassword}`    
    //agent: false,
    //rejectUnauthorized: this.opts.ssl && this.opts.sslStrict !== false
  };
  //console.log ("DEBUG: options for request: " + JSON.stringify(requestOptions));
  console.log (`DEBUG: about to submit request: ${requestStringified}`.green);
  console.log (`DEBUG: submit options: ${JSON.stringify(requestOptions)}`.green);
  console.log (`DEBUG: submit body: ${requestStringified}`);
  //console.log ("DEBUG: request object: " + JSON.stringify(RPCRequestObject));

  var theHTTPrequest = http.request(requestOptions);

  try {
    //console.log("DEBUG: got to here");
    theHTTPrequest.on('error', function(theError) {
      response.writeHead(500);
      numberRequestsRunning --;
      var result =  {
        error: `Eror during commmunication with rpc server. ${theError}. `,
      }
      response.end(JSON.stringify(result));
      console.log(JSON.stringify(result));
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
        var result =  {
          error: `Eror during commmunication with rpc server. ${yetAnotherError}. `,
        }
        response.end(JSON.stringify(result));
        //console.log(`Eror during commmunication with rpc server. ${yetAnotherError}. `);  
      });
      theHTTPresponse.on('end', function() {
        numberRequestsRunning --;
        //console.log(`DEBUG: about to respond with status code: ${theHTTPresponse.statusCode}. Final data: ${finalData}`);
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
          var result = {
            error: errorParsing,
            kanbanGOResult: dataParsed,            
          }
          return response.end(JSON.stringify(result));
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

module.exports = {
  handleQuery
}