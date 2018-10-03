"use strict";

var urlStrings = {
  rpcCallLabel: "rpcCall",
  command: "command"
};

/**
 * @type {Object.<string,{rpcCall:string, method: string, mandatoryFixedArguments: Object, mandatoryModifiableArguments: Object, types: Object, parameters: string[]}>}
 */
var rpcCalls = {
  getBlockByHeight: {
    rpcCall: "getBlockByHeight", //<- must be the same as the command name, used for autocomplete purposes
    method: "getblockhash", //<- rpc method name 
    mandatoryFixedArguments: { //<- values give defaults, null for none
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      blockNumber: null
    },
    types: {
      blockNumber: "number"
    },
    parameters: ["blockNumber"]
  },
}

function getPOSTBodyFromRPCLabel(theRPCLabel, theArguments) {
  var theRequest = {};
  theRequest[urlStrings.rpcCallLabel] = theRPCLabel;
  if (theArguments === undefined) {
    theArguments = {};
  }
  for (var label in theArguments) {
    theRequest[label] = theArguments[label];
  }
  return `${encodeURIComponent(JSON.stringify(theRequest))}`;
}


module.exports = {
  rpcCalls,
  urlStrings,
  getPOSTBodyFromRPCLabel
}