"use strict";
const pathnames = require('./pathnames');
const assert = require('assert')
const childProcess = require('child_process');
const globals = require('./globals');
const implementation = require('./implementation_handlers_my_nodes');

var handlersReturnWhenDone = {};
handlersReturnWhenDone[pathnames.myNodesCommands.fetchNodeInfo.myNodesCommand] = implementation.fetchNodeInfo;

function myNodeCall(request, response, desiredCommand) {
  //console.log("DEBUG: Got to here");
  var commandLabel = desiredCommand[pathnames.myNodesCommand];
  var responseJSON = {};
  if (commandLabel === null || commandLabel === undefined || typeof commandLabel !== "string") {
    response.writeHead(200);
    responseJSON.error = `Input needs a valid ${pathnames.myNodesCommand} entry, the entry I understood was: ${commandLabel}`;  
    return response.end(JSON.stringify(responseJSON));
  } 
  if (commandLabel in pathnames.myNodesCommands) {
    if (!(commandLabel in handlersReturnWhenDone)) {
      response.writeHead(200);
      responseJSON.error = `Command: ${commandLabel} is recognized but appears to not be implemented yet.`;  
      return response.end(JSON.stringify(responseJSON));   
    }
    return handlersReturnWhenDone[commandLabel](request, response, desiredCommand);
  }
  response.writeHead(200);
  responseJSON.error = `Unrecognized command: ${commandLabel}`;  
  return response.end(JSON.stringify(responseJSON));
}

module.exports = {
  myNodeCall
}