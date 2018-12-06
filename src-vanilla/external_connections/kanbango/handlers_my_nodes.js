"use strict";
const ResponseWrapper = require('../../response_wrapper').ResponseWrapper;
const handlersInitialization = require('./handlers_initialization'); 
const NodeKanbanGo = handlersInitialization.NodeKanbanGo;
//const kanbanGoInitializer =  handlersInitialization.getInitializer();


function NodeManager() {

}

NodeManager.prototype.fetchMyNodesInfo = function(    
  /** @type {ResponseWrapper} */
  response, 
  queryCommand,
  notUsed
) {

  response.writeHead(500);
  var result = {
    error: "Not implemented yet"
  };
  response.end(JSON.stringify(result)); 
}

var nodeManager = new NodeManager();
global.nodeManager = nodeManager;

module.exports = {
  nodeManager
}
