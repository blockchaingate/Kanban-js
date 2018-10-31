"use strict";

var urlStrings = {
  node: "node",
  rpcCallLabel: "rpcCall",
  errorKanbanNodeStartWasNeverAttempted: "KanbanGo start was never attempted. ",
};

/**
 * @type {Object.<string,{rpcCall:string, method: string, mandatoryFixedArguments: Object, mandatoryModifiableArguments: Object, optionalArguments: Object, types: Object, parameters: string[]}>}
 */
var rpcCalls = {
  //The method names of the ethereum calls are composed like this:
  //1. Take the function name, say, TestSha3. 
  //2. Lowercase the first letter, say, testSha3.
  //3. Prefix the name with the module name, say, cryptotest_testSha3.
  testSha3: {
    rpcCall: "testSha3", //must be same as rpc label, used for autocomplete
    method: "cryptotest_testSha3", //<- name of go's RPC method 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      message: null
    },
    optionalArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: ["message"]
  },
  testPrivateKeyGeneration: {
    rpcCall: "testPrivateKeyGeneration",
    method: "cryptotest_testPrivateKeyGeneration",
    parameters: []
  },
  testPublicKeyFromPrivate: {
    rpcCall: "testPublicKeyFromPrivate",
    method: "cryptotest_testPublicKeyFromPrivate", 
    mandatoryModifiableArguments: {
      privateKey: null
    },
    parameters: ["privateKey"]
  },
  testSchnorrSignature: {
    rpcCall: "testSchnorrSignature", 
    method: "cryptotest_testSchnorrSignature",
    mandatoryModifiableArguments: {
      privateKey: null,
      messageBase64: null
    },
    parameters: ["privateKey", "messageBase64"]
  },
  testSchnorrVerification: {
    rpcCall: "testSchnorrVerification",
    method: "cryptotest_testSchnorrVerification",
    mandatoryModifiableArguments: {
      signature: null,
      publicKey: null,
      messageBase64: null,
    },
    parameters: ["signature", "publicKey", "messageBase64"]
  },
  testAggregateInitialize: {
    rpcCall: "testAggregateInitialize",
    method: "cryptotest_testAggregateInitialize",
    mandatoryModifiableArguments: {
      numberOfPrivateKeysToGenerate: null
    },
    parameters: ["numberOfPrivateKeysToGenerate"]    
  },
  testAggregateCommitment: {
    rpcCall: "testAggregateCommitment",
    method: "cryptotest_testAggregateCommitment",
    mandatoryModifiableArguments: {
      messageBase64: null
    },
    parameters: ["messageBase64"]    
  },
  testAggregateChallenge: {
    rpcCall: "testAggregateChallenge",
    method: "cryptotest_testAggregateChallenge",
    mandatoryModifiableArguments: {
      commitmentsBase64: null,
      committedSigners: null
    },
    parameters: ["commitmentsBase64", "committedSigners"]    
  },
  testAggregateSolutions: {
    rpcCall: "testAggregateSolutions",
    method: "cryptotest_testAggregateSolutions",
    mandatoryModifiableArguments: {
      committedSigners: null,
      digest: null,
      aggregateCommitment: null,
      aggregatePublicKey: null
    },
    parameters: ["committedSigners", "digest", "aggregateCommitment", "aggregatePublicKey"]    
  },
  testAggregateSignature: {
    rpcCall: "testAggregateSignature",
    method: "cryptotest_testAggregateSignature",
    mandatoryModifiableArguments: {
      committedSigners: null,
      solutionsBase64: null,
    },
    parameters: ["committedSigners", "solutionsBase64"]    
  },
  testAggregateVerification: {
    rpcCall: "testAggregateVerification",
    method: "cryptotest_testAggregateVerification",
    mandatoryModifiableArguments: {
      signature: null,
      committedSigners: null,
      allPublicKeysBase64: null,
      messageBase64: null,
    },
    parameters: ["signature", "committedSigners", "allPublicKeysBase64", "messageBase64"]    
  },
  testAggregateVerificationComplete: {
    rpcCall: "testAggregateVerificationComplete",
    method: "cryptotest_testAggregateVerificationComplete",
    mandatoryModifiableArguments: {
      signatureComplete: null,
      messageBase64: null
    },
    parameters: ["signatureComplete", "messageBase64"]
  },
  getBlockByNumber: {
    rpcCall: "getBlockByNumber",
    method: "kanban_getBlockByNumber",
    mandatoryFixedArguments: {
      verbose: true
    },
    mandatoryModifiableArguments: {
      blockNumber: null
    },
    types: {
      blockNumber: "numberHex"
    },
    parameters: ["blockNumber", "verbose"]
  },
  getBlockByHash: {
    rpcCall: "getBlockByHash",
    method: "kanban_getBlockByHash",
    mandatoryFixedArguments: {
      verbose: true
    },
    mandatoryModifiableArguments: {
      blockHash: null
    },
    parameters: ["blockHash", "verbose"]
  },
  round: {
    rpcCall: "round",
    method: "pbft_round",
    parameters: []
  },
  peerView: {
    rpcCall: "peerView",
    method: "pbft_peerView", //<- method name passed to kanban-go
    parameters: []
  },
  roundChangeRequests: {
    rpcCall: "roundChangeRequests",
    method: "pbft_roundChangeRequests", //<- method name passed to kanban-go
    parameters: []
  },
  validators: {
    rpcCall: "validators",
    method: "pbft_validators",
    parameters: []
  },
  versionGO: {
    rpcCall: "versionGO",
    method: "web3_clientVersion",
    parameters: []
  }, 
};

module.exports = {
  urlStrings,
  rpcCalls
}