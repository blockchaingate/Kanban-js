"use strict";

var urlStrings = {
  rpcCallLabel: "rpcCall",
  command: "command"
};

/**
 * @type {Object.<string,{rpcCall:string, method: string, mandatoryFixedArguments: Object, mandatoryModifiableArguments: Object, types: Object, parameters: string[]}>}
 */
var rpcCalls = {
  getBlockByHeight: {
    rpcCall: "getBlockByHeight", //<- must be the same as the command name, used for autocomplete purposes
    method: "getblockhash", //<- rpc method name 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      blockNumber: null
    },
    types: {
      blockNumber: "number"
    },
    parameters: ["blockNumber"]
  },
  getBlockCount: {
    rpcCall: "getBlockCount",
    method: "getblockcount",
    parameters: []
  },
  getBestBlockHash: {
    rpcCall: "getBestBlockHash",
    method: "getbestblockhash",
    parameters: []
  },
  getBlockByHash: {
    rpcCall: "getBlockByHash", //<- must be the same as the command name, used for autocomplete purposes
    method: "getblock", //<- rpc method name 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      hash: null
    },
    parameters: ["hash"]
  },
  generateBlocks: {
    rpcCall: "generateBlocks", //<- must be the same as the command name, used for autocomplete purposes
    method: "generate", //<- rpc method name 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      numberOfBlocks: null
    },
    types: {
      numberOfBlocks: "number"
    },
    parameters: ["numberOfBlocks"]
  },
  getTransactionById: {
    rpcCall: "getTransactionById",
    method: "gettransaction",
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      txid: null
    },
    parameters: ["txid"]    
  },
  decodeTransactionRaw: {
    rpcCall: "decodeTransactionRaw",
    method: "decoderawtransaction",
    mandatoryModifiableArguments: {
      hexString: null
    },
    parameters: ["hexString"]
  },
  listContracts: {
    rpcCall: "listContract",
    method: "listcontracts",
    mandatoryModifiableArguments:{
      start: 1,
      maxDisplay: 1000
    },
    parameters: ["start", "maxDisplay"]
  },
  dumpPrivateKey: {
    rpcCall: "dumpPrivateKey",
    method: "dumpprivkey",
    mandatoryModifiableArguments: {
      address: null
    },
    parameters: ["address"]
  }
}

function getPOSTBodyFromRPCLabel(theRPCLabel, theArguments) {
  var theRequest = {};
  theRequest[urlStrings.rpcCallLabel] = theRPCLabel;
  if (theArguments === undefined) {
    theArguments = {};
  }
  for (var label in theArguments) {
    theRequest[label] = theArguments[label];
  }
  return `${encodeURIComponent(JSON.stringify(theRequest))}`;
}


module.exports = {
  rpcCalls,
  urlStrings,
  getPOSTBodyFromRPCLabel
}