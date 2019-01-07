"use strict";
const http = require('http');
const fabcoinRPC = require('./rpc');
const fabcoinInitializationSpec = require('./initialization');
const fabcoinInitialization = require('./handlers_initialization');
const ResponseWrapper = require('../../response_wrapper').ResponseWrapper;

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

function handleRPCArguments(
  /**@type {ResponseWrapper} */
  response, 
  queryCommand, 
  callbackOverridesResponse,
) {
  if (callbackOverridesResponse !== null && callbackOverridesResponse !== undefined) {
    if (typeof callbackOverridesResponse !== "function") {
      console.trace("Callback not a function. ");
      throw `Bad callback. ${JSON.stringify(callbackOverridesResponse)}`;
    }
  }
  try {
    if (queryCommand[fabcoinRPC.urlStrings.rpcCallLabel] === undefined) {
      response.writeHead(400);
      var result = {
        error: `Command is missing the ${fabcoinRPC.urlStrings.rpcCallLabel} entry. `
      };
      return response.end(JSON.stringify(result));        
    }
  } catch (e) {
    response.writeHead(400);
    var result = {
      error: `Failed to extract rpc call label. ${e}`
    };
    return response.end(JSON.stringify(result));        
  }
  var theCallLabel = queryCommand[fabcoinRPC.urlStrings.rpcCallLabel];
  var callCollection = fabcoinRPC.rpcCalls;
  if (!(theCallLabel in callCollection)) {
    response.writeHead(400);
    var result = {
      error: `Fabcoin rpc calls: call label ${theCallLabel} not found. `
    };
    return response.end(JSON.stringify(result));    
  }
  var errors = [];
  var theRequestJSON = getRPCRequestJSON(theCallLabel, queryCommand, errors);
  if (errors.length > 0) {
    response.writeHead(400);
    return response.end(JSON.stringify({error: errors[0]}));
  }
  if (!fabcoinInitialization.getFabcoinNode().flagStartWasEverAttempted) {
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
  
  return handleRPCArgumentsPartTwo(response, requestStringified, callbackOverridesResponse);
}

function handleRPCArgumentsPartTwo(response, requestStringified, callbackOverridesResponse) {
  if (callbackOverridesResponse !== null && callbackOverridesResponse !== undefined) {
    if (typeof callbackOverridesResponse !== "function") {
      throw `Bad callback. ${JSON.stringify(callbackOverridesResponse)}`;
    }
  }
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
  //console.log (`DEBUG: about to submit request: ${requestStringified}`.green);
  //console.log (`DEBUG: submit options: ${JSON.stringify(requestOptions)}`.green);
  //console.log (`DEBUG: submit body: ${requestStringified}`);
  //console.log ("DEBUG: request object: " + JSON.stringify(RPCRequestObject));

  var theHTTPrequest = http.request(requestOptions);

  try {
    //console.log("DEBUG: got to here");
    theHTTPrequest.on('error', function(theError) {
      response.writeHead(500);
      var result =  {
        error: `Eror during commmunication with rpc server. ${theError}. `,
      };
      response.end(JSON.stringify(result));
      console.log(JSON.stringify(result));
    }); 
    theHTTPrequest.on('response', function(theHTTPresponse) {
      var finalData = "";
      //console.log("DEBUG: got response!")
      theHTTPresponse.on('data', function (chunk) {
        finalData += chunk;
        //console.log(`DEBUG: got data chunk: ${chunk}`)
      });
      theHTTPresponse.on('error', function(yetAnotherError) {
        response.writeHead(500);
        var result = {
          error: `Eror during commmunication with rpc server. ${yetAnotherError}. `,
        };
        response.end(JSON.stringify(result));
        //console.log(`Eror during commmunication with rpc server. ${yetAnotherError}. `);  
      });
      theHTTPresponse.on('end', function() {
        //console.log(`DEBUG: about to respond with status code: ${theHTTPresponse.statusCode}. Final data: ${finalData}`);
        //if (theHTTPresponse.statusCode !== 200) {
        //  response.writeHead(theHTTPresponse.statusCode);
        //  return response.end(finalData);
        //}
        try {
          var dataParsed = JSON.parse(finalData);
          if (dataParsed.error !== null && dataParsed.error !== "" && dataParsed.error !== undefined) {
            //console.log("DEBUG: Data parsed error:" + dataParsed.error);
            response.writeHead(200);
            var result = {
              error: dataParsed.error,
            };
            return response.end(JSON.stringify(result));
          }
          if (callbackOverridesResponse !== null && callbackOverridesResponse !== undefined) {
            if (typeof callbackOverridesResponse !== "function") {
              throw `Callback not of type function: callback: ${callbackOverridesResponse}`;
            }
            callbackOverridesResponse(response, dataParsed);
            return;
          }
          response.writeHead(200);
          return response.end(JSON.stringify(dataParsed.result));
        } catch (errorParsing) {
          response.writeHead(500);
          console.log("DEBUG: errorParsing: " + errorParsing);
          var result = {
            error: `Error parsing result ${errorParsing}.`,
            finalData: finalData,
            requestStringified: requestStringified,
          };
          return response.end(JSON.stringify(result));
        }
      });
    });
    //console.log("DEBUG: got to before end.");
    theHTTPrequest.end(requestStringified);
  } catch (e) {
    response.writeHead(500);
    var result = {};
    result.error = `Eror spawning fabcoin-cli process. ${escapeHtml(e)}. `; 
    console.log(`Eror spawning process fabcoin-cli. ${e}`);
  }
}

function ExportedFunctions() {
  global.fabcoinHandlersRPC = this;
  this.handleRPCArgumentsPartTwo = handleRPCArgumentsPartTwo;
  this.handleRPCArguments = handleRPCArguments;
  this.getRPCRequestJSON = getRPCRequestJSON;
}

var fabcoinHandlersRPC = new ExportedFunctions();

module.exports = {
  fabcoinHandlersRPC,
}
