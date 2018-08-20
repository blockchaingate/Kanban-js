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
      privateKey: null
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
    },
    optionalModifiableArguments: {
    },
    allowedArgumentValues: {
    },
    address: "",
    parameters: ["privateKey"]
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
  }
};

module.exports = {
  rpcCalls
}

