"use strict";

var urlStrings = {
  rpcCallLabel: "rpcCall",
  command: "command"
};

/**
 * @type {Object.<string,{rpcCall:string, method: string, mandatoryFixedArguments: Object, mandatoryModifiableArguments: Object, optionalArguments: Object, types: Object, parameters: string[]}>}
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
  getWalletTransactionById: {
    rpcCall: "getWalletTransactionById",
    method: "gettransaction",
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      txid: null,
      includeWatchOnly: false,
    },
    parameters: ["txid", "includeWatchOnly"]    
  },
  getTransactionById: {
    rpcCall: "getTransactionById",
    method: "getrawtransaction",
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      txid: null,
      verbose: true
    },
    parameters: ["txid", "verbose"]    
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
  getNewAddress: {
    rpcCall: "getNewAddress",
    method: "getnewaddress",
    optionalArguments: {
      name: null
    },
    parameters: ["name"]
  },
  dumpPrivateKey: {
    rpcCall: "dumpPrivateKey",
    method: "dumpprivkey",
    mandatoryModifiableArguments: {
      address: null
    },
    parameters: ["address"]
  },
  createRawTransaction: {
    rpcCall: "createRawTransaction",
    method: "createrawtransaction",
    mandatoryModifiableArguments: {
      inputs: null,
      outputs: null
    },
    parameters: ["inputs", "outputs"]
  },
  signRawTransaction: {
    rpcCall: "signRawTransaction",
    method: "signrawtransaction",
    mandatoryFixedArguments: {
      parents: [],
    },
    optionalArguments: {
      privateKeys: null
    },
    mandatoryModifiableArguments: {
      hexString: null,
    },
    parameters: ["hexString", "parents", "privateKeys"]
  },
  sendRawTransaction: {
    rpcCall: "sendRawTransaction",
    method: "sendrawtransaction",
    mandatoryModifiableArguments: {
      rawTransactionHex: null
    },
    parameters: ["rawTransactionHex"]
  },
  getRawMempool: {
    rpcCall: "getRawMempool",
    method: "getrawmempool",
    mandatoryFixedArguments: {
      verbose: null
    },
    parameters: ["verbose"]
  },
  createContract: {
    rpcCall: "createContract",
    method: "createcontract",
    mandatoryModifiableArguments: {
      contractHex: null
    },
    parameters: ["contractHex"]
  },
  sendToContract: {
    rpcCall: "sendToContract",
    method: "sendtocontract",
    mandatoryModifiableArguments: {
      contractId: null,
      data: null,
      amount: 0,
    },
    parameters: ["contractId", "data", "amount"]
  },
  callContract: {
    rpcCall: "callContract",
    method: "callcontract",
    mandatoryModifiableArguments: {
      contractId: null,
      data: null,
    },
    parameters: ["contractId", "data"]
  },
  testSha3: {
    rpcCall: "testSha3", //must be same as rpc label, used for autocomplete
    method: "testshathree",
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      message: null
    },
    types: {
      message: "base64"
    },
    parameters: ["message"]
  },

};

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