"use strict";


var rpcCalls = {
  runNode: {
    rpcCall: "runNode",
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      arguments: null
    },
    parameters: ["arguments"]
  }
}

module.exports = {
  rpcCalls
}