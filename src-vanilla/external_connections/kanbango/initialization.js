"use strict";

/**
 * @type {Object.<string,{rpcCall:string, method: string, mandatoryFixedArguments: Object, mandatoryModifiableArguments: Object, optionalArguments: Object, types: Object, parameters: string[], callOnOneNodeOnly: boolean}>}
 */
var rpcCalls = {
  runNodesOnFAB: {
    rpcCall: "runNodesOnFAB",
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      numberOfNodes: null,
      abiJSON: null,
      contractId: null,
      connectKanbansInALine: null,
      bridgeChainnet: null,
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
  fetchLocalRegtestNodeConfig: {
    rpcCall: "fetchLocalRegtestNodeConfig",
  },
  fetchMyNodesInfo: {
    rpcCall: "fetchMyNodesInfo",
  },
  executeOverSSH: {
    rpcCall: "executeOverSSH",
    mandatoryModifiableArguments: {
      command: null,
    },
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

