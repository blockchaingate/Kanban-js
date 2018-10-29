"use strict";

var urlStrings = {
  node: "node",
  rpcCallLabel: "rpcCall"
};

/**
 * @type {Object.<string,{rpcCall:string, method: string, mandatoryFixedArguments: Object, mandatoryModifiableArguments: Object, optionalArguments: Object, types: Object, parameters: string[]}>}
 */
var rpcCalls = {
  //The method names of the ethereum calls are composed like this:
  //1. Take the function name, say, TestSha3. 
  //2. Lowercase the first letter, say, testSha3.
  //3. Prefix the name with the module name, say, kanban_testSha3.
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
    rpcCall: "testPrivateKeyGeneration", //must be same as rpc label, used for autocomplete
    method: "kanban_testPrivateKeyGeneration", //<- name of go's RPC method 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
    },
    optionalArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: []
  },
  testPublicKeyFromPrivate: {
    rpcCall: "testPublicKeyFromPrivate", //must be same as rpc label, used for autocomplete
    method: "kanban_testPublicKeyFromPrivate", //<- name of go's RPC method 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      privateKey: null
    },
    optionalArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: ["privateKey"]
  },
  testSchnorrSignature: {
    rpcCall: "testSchnorrSignature", //must be same as rpc label, used for autocomplete
    method: "kanban_testSchnorrSignature", //<- name of go's RPC method 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      privateKey: null,
      messageBase64: null
    },
    optionalArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: ["privateKey", "messageBase64"]
  },
  testSchnorrVerification: {
    rpcCall: "testSchnorrVerification", //must be same as rpc label, used for autocomplete
    method: "kanban_testSchnorrVerification", //<- name of go's RPC method 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      signature: null,
      publicKey: null,
      messageBase64: null,
    },
    optionalArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: ["signature", "publicKey", "messageBase64"]
  },
  testAggregateInitialize: {
    rpcCall: "testAggregateInitialize", //must be same as rpc label, used for autocomplete
    method: "kanban_testAggregateInitialize", //<- name of go's RPC method 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      numberOfPrivateKeysToGenerate: null
    },
    optionalArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: ["numberOfPrivateKeysToGenerate"]    
  },
  testAggregateCommitment: {
    rpcCall: "testAggregateCommitment", //must be same as rpc label, used for autocomplete
    method: "kanban_testAggregateCommitment", //<- name of go's RPC method 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      messageBase64: null
    },
    optionalArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: ["messageBase64"]    
  },
  testAggregateChallenge: {
    rpcCall: "testAggregateChallenge", //must be same as rpc label, used for autocomplete
    method: "kanban_testAggregateChallenge", //<- name of go's RPC method 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      commitmentsBase64: null,
      committedSigners: null
    },
    optionalArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: ["commitmentsBase64", "committedSigners"]    
  },
  testAggregateSolutions: {
    rpcCall: "testAggregateSolutions", //must be same as rpc label, used for autocomplete
    method: "kanban_testAggregateSolutions", //<- name of go's RPC method 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      committedSigners: null,
      digest: null,
      aggregateCommitment: null,
      aggregatePublicKey: null
    },
    optionalArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: ["committedSigners", "digest", "aggregateCommitment", "aggregatePublicKey"]    
  },
  testAggregateSignature: {
    rpcCall: "testAggregateSignature", //must be same as rpc label, used for autocomplete
    method: "kanban_testAggregateSignature", //<- name of go's RPC method 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      committedSigners: null,
      solutionsBase64: null,
    },
    optionalArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: ["committedSigners", "solutionsBase64"]    
  },
  testAggregateVerification: {
    rpcCall: "testAggregateVerification", //must be same as rpc label, used for autocomplete
    method: "kanban_testAggregateVerification", //<- name of go's RPC method 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      signature: null,
      committedSigners: null,
      allPublicKeysBase64: null,
      messageBase64: null,
    },
    optionalArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: ["signature", "committedSigners", "allPublicKeysBase64", "messageBase64"]    
  },
  getBlockByNumber: {
    rpcCall: "getBlockByNumber",
    method: "kanban_getBlockByNumber",
    mandatoryFixedArguments: { //<- values give defaults, null for none
      verbose: true
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      blockNumber: null
    },
    types: {
      blockNumber: "numberHex"
    },
    optionalArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: ["blockNumber", "verbose"]
  },
  getBlockByHash: {
    rpcCall: "getBlockByHash",
    method: "kanban_getBlockByHash",
    mandatoryFixedArguments: { //<- values give defaults, null for none
      verbose: true
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      blockHash: null
    },
    optionalArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: ["blockHash", "verbose"]
  },
  round: {
    rpcCall: "round",
    method: "pbft_round",
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
    },
    optionalArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: []
  },
  peerView: {
    rpcCall: "peerView", //must be same as rpc label, used for autocomplete
    method: "pbft_peerView", //<- method name passed to kanban-go
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
    },
    optionalArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: []
  },
  roundChangeRequests: {
    rpcCall: "roundChangeRequests", //must be same as rpc label, used for autocomplete
    method: "pbft_roundChangeRequests", //<- method name passed to kanban-go
    parameters: []
  },
  validators: {
    rpcCall: "validators",
    method: "pbft_validators",
    parameters: []
  },
  versionGO: {
    rpcCall: "versionGO", //must be same as rpc label, used for autocomplete
    method: "web3_clientVersion",
    parameters: []
  }, 
};

module.exports = {
  urlStrings,
  rpcCalls
}