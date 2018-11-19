"use strict";
const queryString = require('querystring');
const http = require('http');
const kanbanGORPC = require('./rpc');
const kanabanGoInitializer = require('./handlers_initialization');
const NodeKanbanGo = kanabanGoInitializer.NodeKanbanGo;

function handleQuery(response, query) {
  var queryCommand = null;
  var queryNode = null;
  try {
    queryCommand = JSON.parse(query.command);
    queryNode = JSON.parse(query[kanbanGORPC.urlStrings.node]);    
  } catch (e) {
    response.writeHead(400);
    return response.end(`Bad KanbanGO RPC input. ${e}`);
  }
  return handleRPCArguments(response, queryCommand, queryNode);
}

var numberRequestsRunning = 0;
var maxRequestsRunning = 20;

function getParameterFromType(input, type) {
  if (type === "number") {
    return Number(input);
  }
  if (type === "numberHex") {
    if (typeof input === "string") {
      if (!input.startsWith("0x")) {
        input = "0x" + input;
      }
      return input;
    }
  }
  return input;
}

function getRPCRequestJSON(rpcCallLabel, queryCommand, errors) {
  /**@type {{rpcCall: string, method: string, mandatoryFixedArguments: Object,  mandatoryModifiableArguments: Object,  optionalArguments: Object, allowedArgumentValues: Object, parameters: string[]}}*/
  var currentRPCCall = kanbanGORPC.rpcCalls[rpcCallLabel];
  var currentParameters = [];
  if (currentRPCCall.parameters === undefined || currentRPCCall.parameters === null) {
    currentRPCCall.parameters = [];
  }
  for (var counterCommands = 0; counterCommands < currentRPCCall.parameters.length; counterCommands ++) {
    var currentParameterName = currentRPCCall.parameters[counterCommands];
    if (currentRPCCall.mandatoryFixedArguments !== undefined && currentRPCCall.mandatoryFixedArguments !== null) {
      if (currentParameterName in currentRPCCall.mandatoryFixedArguments) {
        currentParameters.push(currentRPCCall.mandatoryFixedArguments[currentParameterName]);
        continue;
      }
    }
    if (currentParameterName in queryCommand) {
      var incomingParameter = queryCommand[currentParameterName];
      if (currentRPCCall.types !== undefined) {
        incomingParameter = getParameterFromType(incomingParameter, currentRPCCall.types[currentParameterName]);
      }
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
        errors.push(`Missing parameter ${currentParameterName} in method ${rpcCallLabel}.`);
        return {};
      }
      var currentDefault = currentRPCCall.optionalArguments[currentParameterName];
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

function handleRPCArguments(response, queryCommand, queryNode) {
  numberRequestsRunning ++;
  if (numberRequestsRunning > maxRequestsRunning) {
    response.writeHead(500);
    numberRequestsRunning --;
    var reponseJSON = {
      error: `Too many (${numberRequestsRunning}) requests running, maximum allowed: ${maxRequestsRunning}`
    };
    return response.end(JSON.stringify(reponseJSON));
  }
  var currentNode = null;
  try {
    if (queryCommand[kanbanGORPC.urlStrings.rpcCallLabel] === undefined) {
      response.writeHead(400);
      numberRequestsRunning --;
      var reponseJSON = {
        error: `Command is missing the ${kanbanGORPC.urlStrings.rpcCallLabel} entry. `
      };
      return response.end(JSON.stringify(reponseJSON));        
    }
    var currentNodeId = queryNode.id;
    //if (currentNodeId === "none") {
    //  currentNodeId = 0;
    //}
    if (currentNodeId === undefined || currentNodeId === null) {
      response.writeHead(400);
      numberRequestsRunning --;
      var reponseJSON = {
        error: `Node is missing the id variable. `
      };
      return response.end(JSON.stringify(reponseJSON));        
    }
    var currentNodeIdNumber = Number(currentNodeId);
    var initializer = kanabanGoInitializer.getInitializer(); 
    currentNode = initializer.nodes[currentNodeIdNumber];
    if (currentNode === undefined || currentNode === null) {
      response.writeHead(400);
      numberRequestsRunning --;
      var reponseJSON = {
        error: `Failed to extract node id from ${currentNodeId}.`
      };
      if (!initializer.flagStartWasEverAttempted) {
        reponseJSON.error = kanbanGORPC.urlStrings.errorKanbanNodeStartWasNeverAttempted;        
      }
      return response.end(JSON.stringify(reponseJSON));          
    }
  } catch (e) {
    response.writeHead(400);
    numberRequestsRunning --;
    return response.end(`Failed to extract node id. ${e}`);        
  }
  var theCallLabel = queryCommand[kanbanGORPC.urlStrings.rpcCallLabel];
  var callCollection = kanbanGORPC.rpcCalls;
  if (!(theCallLabel in callCollection)) {
    response.writeHead(400);
    numberRequestsRunning --;
    var reponseJSON = {
      error: `RPC call label ${theCallLabel} not found. `
    };
    return response.end(JSON.stringify(reponseJSON));    
  }
  var currentCall = callCollection[theCallLabel];
  if (currentCall.easyAccessControlOrigin === true) {
    //console.log("Setting header ...");
    response.setHeader('Access-Control-Allow-Origin', '*');
  }
  var errors = [];
  var theRequestJSON = getRPCRequestJSON(theCallLabel, queryCommand, errors);
  if (errors.length > 0) {
    response.writeHead(400);
    numberRequestsRunning --;
    return response.end(JSON.stringify({error: errors[0]}));
  }
  return handleRPCArgumentsPartTwo(response, theRequestJSON, currentNode);
}

function handleRPCArgumentsPartTwo(response, theRequestJSON, /**@type {{NodeKanbanGo}} */ currentNode) {
  var requestStringified = JSON.stringify(theRequestJSON);
  var requestOptions = {
    host: '127.0.0.1',
    port: currentNode.RPCPort,
    method: 'POST',
    path: '/',
    headers: {
      'Host': 'localhost',
      'Content-Length': requestStringified.length,
      'Content-Type': 'application/json'
    },
    //auth: "bb98a0b6442386d0cdf8a31b267892c1"    
    //agent: false,
    //rejectUnauthorized: this.opts.ssl && this.opts.sslStrict !== false
  };
  var theRequest = {
    request: theRequestJSON,
    options: requestOptions
  };

  currentNode.outputStreams.rpcCalls.log(JSON.stringify(theRequest));

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
            error: `Error parsing kanbanGO's output. Error message: ${errorParsing}. `,
            kanbanGoData: finalData
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