"use strict";

/**
 * @type {Object.<string,{rpcCall:string, method: string, mandatoryFixedArguments: Object, mandatoryModifiableArguments: Object, optionalArguments: Object, types: Object, parameters: string[]}>}
 */
var rpcCalls = {
  runNodes: {
    rpcCall: "runNodes",
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      numberOfNodes: null
    },
  },
  getLogFile: {
    rpcCall: "getLogFile",
  },
  getRPCLogFile: {
    rpcCall: "getRPCLogFile",
  },  
  getNodeInformation: {
    rpcCall: "getNodeInformation",
  },
  compileSolidity: {
    rpcCall: "compileSolidity",
    mandatoryModifiableArguments: {
      code: null
    }
  },
  fetchKanbanContract: {
    rpcCall: "fetchKanbanContract",    
  }
};

module.exports = {
  rpcCalls
}

