"use strict";
const pathnames = require('./pathnames');
const implementation = require('./implementation_handlers_my_nodes');
const fabcoinOldInitialization = require('./external_connections/fabcoin_old/initialization');

var myNodeCommands = fabcoinOldInitialization.myNodesCommands;

var handlersReturnWhenDone = {};
handlersReturnWhenDone[myNodeCommands.fetchNodeInfo.myNodesCommand] = implementation.fetchNodeInfo;
handlersReturnWhenDone[myNodeCommands.sshNodeToOneRemoteMachineGitPull.myNodesCommand] = implementation.sshNodeToOneRemoteMachineGitPull;
handlersReturnWhenDone[myNodeCommands.sshNodeToOneRemoteMachineKillallFabcoind.myNodesCommand] = implementation.sshNodeToOneRemoteMachineKillallFabcoind; 
handlersReturnWhenDone[myNodeCommands.sshNodeToOneRemoteMachineNodeRestart.myNodesCommand] = implementation.sshNodeToOneRemoteMachineNodeRestart; 
handlersReturnWhenDone[myNodeCommands.sshNodeToOneRemoteMachineStartFabcoind.myNodesCommand] = implementation.sshNodeToOneRemoteMachineStartFabcoind; 
handlersReturnWhenDone[myNodeCommands.sshNodeToOneRemoteMachineDeleteFabcoinConfiguration.myNodesCommand] = implementation.sshNodeToOneRemoteMachineDeleteFabcoinConfiguration; 
handlersReturnWhenDone[myNodeCommands.sshNodeToOneRemoteMachineGitPullMakeFab.myNodesCommand] = implementation.sshNodeToOneRemoteMachineGitPullMakeFab; 

function myNodeCall(request, response, desiredCommand) {
  //console.log("DEBUG: Got to here");
  var commandLabel = desiredCommand[pathnames.myNodesCommand];
  var responseJSON = {};
  if (commandLabel === null || commandLabel === undefined || typeof commandLabel !== "string") {
    response.writeHead(200);
    responseJSON.error = `Input needs a valid ${pathnames.myNodesCommand} entry, the entry I understood was: ${commandLabel}`;  
    return response.end(JSON.stringify(responseJSON));
  } 
  if (commandLabel in myNodeCommands) {
    if (!(commandLabel in handlersReturnWhenDone)) {
      response.writeHead(200);
      responseJSON.error = `Command: ${commandLabel} is recognized but appears to not be implemented yet.`;  
      console.log(responseJSON.error);
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