"use strict";
const pathnames = require('./pathnames');

var urlStrings = {
  node: "node"
};

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
    optionalModifiableArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: ["signature", "committedSigners", "allPublicKeysBase64", "messageBase64"]    
  },
  dumpBlock: {
    rpcCall: "dumpBlock",
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
    optionalModifiableArguments: {
    },
    allowedArgumentValues: {
    },
    parameters: ["blockNumber", "verbose"]
  },
    round: {
        rpcCall: "round",
        method: "pbft_round",
        mandatoryFixedArguments: { //<- values give defaults, null for none
        },
        mandatoryModifiableArguments: { //<- values give defaults, null for none
        },
        optionalModifiableArguments: {
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
        optionalModifiableArguments: {
        },
        allowedArgumentValues: {
        },
        parameters: []
    },
    validators: {
        rpcCall: "validators",
        method: "pbft_validators",
        mandatoryFixedArguments: { //<- values give defaults, null for none
        },
        mandatoryModifiableArguments: { //<- values give defaults, null for none
        },
        optionalModifiableArguments: {
        },
        allowedArgumentValues: {
        },
        parameters: []
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
    parameters: []
  },
};

function getPOSTBodyFromKanbanGORPCLabel(theRPCLabel, theArguments) {
  var theRequest = {};
  theRequest[pathnames.rpcCall] = theRPCLabel;
  if (theArguments === undefined) {
    theArguments = {};
  }
  for (var label in theArguments) {
    theRequest[label] = theArguments[label];
  }
  return `${encodeURIComponent(JSON.stringify(theRequest))}`;
}

module.exports = {
  urlStrings,
  rpcCalls,
  getPOSTBodyFromKanbanGORPCLabel
}