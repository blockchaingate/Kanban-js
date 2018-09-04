"use strict";
const pathnames = require('./pathnames');

var rpcCalls = {
  createNodes: {
    rpcCall: "createNodes",
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
    address: ""
  }
};

module.exports = {
  rpcCalls
}

