"use strict";

/**
 * @type {Object.<string,{rpcCall:string, method: string, mandatoryFixedArguments: Object, mandatoryModifiableArguments: Object, optionalArguments: Object, types: Object, parameters: string[], callOnOneNodeOnly: boolean}>}
 */
var rpcCalls = {
  runNodesDetached: {
    rpcCall: "runNodesDetached",
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      numberOfNodes: null
    },
  },
  runNodesOnFAB: {
    rpcCall: "runNodesOnFAB",
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      numberOfNodes: null,
      abiJSON: null,
      contractId: null,
    },
  },
  killAllGeth: {
    rpcCall: "killAllGeth",
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
  },
  fetchNodeConfig: {
    rpcCall: "fetchNodeConfig",
  },
};

/**
 * @type {Object.<string,{rpcCall:string, method: string, mandatoryFixedArguments: Object, mandatoryModifiableArguments: Object, optionalArguments: Object, types: Object, parameters: string[]}>}
 */
var demoRPCCalls = {
  fetchDemoContract: {
    rpcCall: "fetchDemoContract",    
  }
};

module.exports = {
  rpcCalls,
  demoRPCCalls,
}

