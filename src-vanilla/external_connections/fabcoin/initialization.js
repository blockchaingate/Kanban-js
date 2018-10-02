"use strict";


var rpcCalls = {
  runFabcoind: {
    rpcCall: "runFabcoind", //<- must be the same as the command name, used for autocomplete purposes
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      arguments: null
    },
    parameters: ["arguments"]
  },
  showLogFabcoind: {
    rpcCall: "showLogFabcoind",
    parameters: []
  },
  killAllFabcoind: {
    rpcCall: "killAllFabcoind",
    parameters: []
  }
}

module.exports = {
  rpcCalls
}