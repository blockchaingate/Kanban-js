"use strict";
const pathnames = require('./pathnames');

var rpcCalls = {
  //The method names of the ethereum calls are composed like this:
  //1. Take the function name, say, TestSha3. 
  //2. Lowercase the first letter, say, testSha3.
  //3. Prefix the name with the module name, say, kanban_testSha3.

  testSha3: {
    rpcCall: "testSha3", //must be same as rpc label, used for autocomplete
    method: "kanban_testSha3", //<- name of go's RPC method 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      message: null
    },
    optionalModifiableArguments: {
    },
    allowedArgumentValues: {
    },
    address: "",
    parameters: ["message"]
  },
  testPrivateKeyGeneration: {
    rpcCall: "testPrivateKeyGeneration", //must be same as rpc label, used for autocomplete
    method: "kanban_testPrivateKeyGeneration", //<- name of go's RPC method 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
    },
    optionalModifiableArguments: {
    },
    allowedArgumentValues: {
    },
    address: "",
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
    optionalModifiableArguments: {
    },
    allowedArgumentValues: {
    },
    address: "",
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
    optionalModifiableArguments: {
    },
    allowedArgumentValues: {
    },
    address: "",
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
    optionalModifiableArguments: {
    },
    allowedArgumentValues: {
    },
    address: "",
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
    optionalModifiableArguments: {
    },
    allowedArgumentValues: {
    },
    address: "",
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
    optionalModifiableArguments: {
    },
    allowedArgumentValues: {
    },
    address: "",
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
    optionalModifiableArguments: {
    },
    allowedArgumentValues: {
    },
    address: "",
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
    optionalModifiableArguments: {
    },
    allowedArgumentValues: {
    },
    address: "",
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
    optionalModifiableArguments: {
    },
    allowedArgumentValues: {
    },
    address: "",
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
      allPublicKeys: null,
      messageBase64: null,
    },
    optionalModifiableArguments: {
    },
    allowedArgumentValues: {
    },
    address: "",
    parameters: ["signature", "committedSigners", "allPublicKeys", "messageBase64"]    
  },
  versionGO: {
    rpcCall: "versionGO", //must be same as rpc label, used for autocomplete
    method: "web3_clientVersion",
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
    },
    optionalModifiableArguments: {
    },
    allowedArgumentValues: {
    },
    address: "",
    parameters: []
  },
};

module.exports = {
  rpcCalls
}

