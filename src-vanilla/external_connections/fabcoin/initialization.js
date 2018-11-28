"use strict";

var urlStrings = {
  errorFabNeverStarted: "Fabcoind was never started. "
};

var rpcCalls = {
  runFabcoind: {
    rpcCall: "runFabcoind", //<- must be the same as the command name, used for autocomplete purposes
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      arguments: null,
      smartContractId: null,
    },
    parameters: ["arguments", "smartContractId"],
  },
  showLogFabcoind: {
    rpcCall: "showLogFabcoind",
    parameters: [],
  },
  killAllFabcoind: {
    rpcCall: "killAllFabcoind",
    parameters: [],
  },
};

var demoRPCCalls = {
  demoRegisterSmartContractAndABI: {
    rpc: "demoRegisterSmartContractAndABI",
    mandatoryModifiableArguments: {
      smartContractId: null,
      ABI: null,
    },
    parameters: ["smartContractId", "ABI"],
  },
  demoRegisterCorporation: {
    rpcCall: "demoRegisterCorporation",
    mandatoryModifiableArguments: {
      corporationNameHex: null
    },
    parameters: ["corporationNameHex"],
  },
  demoGetAllCorporations: {
    rpcCall: "demoGetAllCorporations",
    parameters: [],
  },
  demoGetNonce: {
    rpcCall: "demoGetNonce",
    parameters: [],
  },
  demoIssuePoints: {
    rpcCall: "demoIssuePoints",
    mandatoryModifiableArguments: {
      corporationNameHex: null,
      moneySpent: null,
    },
    parameters: ["corporationNameHex", "moneySpent"],
  },
  demoRedeemPoints: {
    rpcCall: "demoRedeemPoints",
    mandatoryModifiableArguments: {
      nonce: null,
    },
    parameters: ["nonce"],
  },
};

module.exports = {
  rpcCalls,
  demoRPCCalls,
  urlStrings
}
