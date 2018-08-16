"use strict";
const pathnames = require('./pathnames');

var rpcCalls = {
  testSha3: {
    rpcCall: "testSha3", //must be same as rpc label, used for autocomplete
    method: "testSha3", //<- name of go's RPC method 
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
    cli: ["message"]
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
    cli: []
  }
};

module.exports = {
  rpcCalls
}

