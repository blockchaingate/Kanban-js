"use strict";
const ResponseWrapper = require('../../response_wrapper').ResponseWrapper;
const handlersInitialization = require('./handlers_initialization'); 
const NodeKanbanGo = handlersInitialization.NodeKanbanGo;
var getConfiguration = require('../../configuration').getConfiguration;
const miscellaneous = require('../../miscellaneous');
//const kanbanGoInitializer =  handlersInitialization.getInitializer();

if (getConfiguration === null || getConfiguration === undefined) {
  throw ("Bad module import order: failed to import configuration.");
}


function NodeManager() {

}

NodeManager.prototype.fetchMyNodesInfo = function(    
  /** @type {ResponseWrapper} */
  response, 
  queryCommand,
  notUsed,
) {
  response.writeHead(500);
  console.log(`DEBUG: My nodes: ${JSON.stringify(getConfiguration().configuration.myNodes)}. `)
  var result = {
    myNodes: miscellaneous.deepCopy(getConfiguration().configuration.myNodes, 0)
  };
  //security: trim ssh keys, leaving only the first few characters.
  //This is enough information to identify the key without leaking too many bits. 
  for (var label in result.myNodes) {
    var currentNode = result.myNodes[label];
    if (typeof currentNode.sshKey !== "string") {
      continue;
    }
    if (currentNode.sshKey.length > 52) {
      currentNode.sshKey = miscellaneous.trimStringAtEnds(currentNode.sshKey, 52, 0, true);      
    }
  }
  response.end(JSON.stringify(result)); 
}

var nodeManager = new NodeManager();
global.nodeManager = nodeManager;

module.exports = {
  nodeManager
}
