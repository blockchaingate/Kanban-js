"use strict";

const pathnames = require('../../pathnames');

var url = pathnames.url;

var networkData = {
  regtest: {
    name: "regtest", //<-same as label, for autocomplete
    rpcOption: "-regtest",
    folder: "regtest/",
    rpcPort: 18443,
    security: 1,
    logFileLink: null,
    transactionProtocolLabel: "testnet",
    auth: null
  },
  testNetNoDNS: {
    name: "testNetNoDNS", //<-same as label, for autocomplete
    rpcOption: "-testnetnodns",
    folder: "testnet_no_dns/",
    rpcPort: 23117,
    security: 10,
    logFileLink: url.known.logFileTestNetNoDNS,
    transactionProtocolLabel: "testnet",
    auth: null  
  },
  testNet: {
    name: "testNet", //<-same as label, for autocomplete
    rpcOption: "-testnet",
    folder: "testnet3/",
    rpcPort: 18332,
    security: 100,
    logFileLink: url.known.logFileTestNet,
    transactionProtocolLabel: "testnet",
    auth: null
  },
  mainNet: { 
    name: "mainNet", //<-same as label, for autocomplete
    rpcOption: "-mainnet",
    folder: "./",
    rpcPort: 8667,
    security: 1000,
    logFileLink: url.known.logFileMainNet,
    transactionProtocolLabel: "bitcoin",
    auth: null
  }
};

var networkDataKanbanProofOfConcept = {
  testKanban : {
    name: "testKanban",
    folder: "testkanban/",
    rpcPort: 10007,
    rpcOption: "-testkanban",
  },
  mainKanban: {
    name: "mainKanban",
    rpcOption: "-mainnet",
  }
};

var rpcCallsKanban = {
  listReceivedByAddress: {
    rpcCall: "listReceivedByAddress", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "listreceivedbyaddress",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      minimumConfirmations: 0,
      includeEmpty: true
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command", "minimumConfirmations", "includeEmpty"]
  },
  dumpPrivateKey: {
    rpcCall: "dumpPrivateKey", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "dumpprivkey",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      address: null
    },
    allowedArgumentValues: {
      net: [ //<- restricted network access!
        networkDataKanbanProofOfConcept.testKanban.rpcOption
      ]
    },
    address: "",
    cli: ["net", "command", "address"]
  },
  testPublicKeyGeneration: {
    rpcCall: "testPublicKeyGeneration", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "testpublickeygeneration",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      privateKey: null
    },
    allowedArgumentValues: {
      net: [ //<- restricted network access!
        networkDataKanbanProofOfConcept.testKanban.rpcOption
      ]
    },
    address: "",
    cli: ["net", "command", "privateKey"]
  },
  testAggregateSignatureInitialize: {
    rpcCall: "testAggregateSignatureInitialize", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "testaggregatesignatureinitialize",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      numberOfPrivateKeysToGenerate: null,
    },
    allowedArgumentValues: {
      net: [ //<- restricted network access!
        networkDataKanbanProofOfConcept.testKanban.rpcOption
      ]
    },
    address: "",
    cli: ["net", "command", "numberOfPrivateKeysToGenerate"]
  },
  testAggregateSignatureCommitment: {
    rpcCall: "testAggregateSignatureCommitment", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "testaggregatesignaturecommit",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      message: null
    },
    optionalModifiableArguments: {
      nonces: null
    },
    allowedArgumentValues: {
      net: [ //<- restricted network access!
        networkDataKanbanProofOfConcept.testKanban.rpcOption
      ]
    },
    address: "",
    cli: ["net", "command", "message", "nonces"]
  },
  testAggregateSignatureChallenge: {
    rpcCall: "testAggregateSignatureChallenge", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "testaggregatesignaturechallenge",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      committedSignersBitmap: null,
      commitments: null,
    },
    allowedArgumentValues: {
      net: [ //<- restricted network access!
        networkDataKanbanProofOfConcept.testKanban.rpcOption
      ]
    },
    address: "",
    cli: ["net", "command", "committedSignersBitmap", "commitments"]
  },
  testAggregateSignatureSolutions: {
    rpcCall: "testAggregateSignatureSolutions", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "testaggregatesignaturesolutions",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      committedSignersBitmap: null,
      messageDigest: null,
      aggregatedCommitment: null, 
      aggregatedPublicKey: null
    },
    allowedArgumentValues: {
      net: [ //<- restricted network access!
        networkDataKanbanProofOfConcept.testKanban.rpcOption
      ]
    },
    address: "",
    cli: ["net", "command", "committedSignersBitmap", "messageDigest", "aggregatedCommitment", "aggregatedPublicKey"]
  },
  testAggregateSignatureAggregation: {
    rpcCall: "testAggregateSignatureAggregation", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "testaggregatesignatureaggregation",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      solutions: null
    },
    allowedArgumentValues: {
      net: [ //<- restricted network access!
        networkDataKanbanProofOfConcept.testKanban.rpcOption
      ]
    },
    address: "",
    cli: ["net", "command", "solutions"]
  },
  testAggregateSignatureVerification: {
    rpcCall: "testAggregateSignatureVerification", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "testaggregatesignatureverification",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      signature: null,
      committedSignersBitmap: null,
      publicKeys: null,
      message: null
    },
    allowedArgumentValues: {
      net: [ //<- restricted network access!
        networkDataKanbanProofOfConcept.testKanban.rpcOption
      ]
    },
    address: "",
    cli: ["net", "command", "signature", "committedSignersBitmap", "publicKeys", "message"]
  },

  testSchnorrSignature: {
    rpcCall: "testSchnorrSignature", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "testschnorrsignature",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      privateKey: null,
      message: null,
    },
    optionalModifiableArguments: {
      nonce: null
    },
    allowedArgumentValues: {
      net: [ //<- restricted network access!
        networkDataKanbanProofOfConcept.testKanban.rpcOption
      ]
    },
    address: "",
    cli: ["net", "command", "privateKey", "message", "nonce"]
  },
  testSchnorrSignatureVerify: {
    rpcCall: "testSchnorrSignatureVerify", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "testschnorrverification",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      signature: null,
      publicKey: null,
      message: null
    },
    allowedArgumentValues: {
      net: [ //<- restricted network access!
        networkDataKanbanProofOfConcept.testKanban.rpcOption
      ]
    },
    address: "",
    cli: ["net", "command", "signature", "publicKey", "message"]
  },
};

var rpcCalls = {
  getBlock: {
    rpcCall: "getBlock", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "getblock"
    },
    //mandatoryModifiableArguments can be omitted if there are none.
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      blockHash: null,
      verbosity: null
    },
    //optional modifiable arguments are implied by the value of cli
    //Specify the optional modifyable arguments only if you want to give them default values.
    optionalModifiableArguments: { //<- values give defaults, null for none. 
    },
    allowedArgumentValues: { //<- pass null to use global defaults
      net: null
    },
    cli: ["net", "command", "blockHash", "verbosity"]
  },
  getPeerInfo: {
    rpcCall: "getPeerInfo", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<-values give defaults, null for none
      command: "getpeerinfo"
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command"]
  },
  getNetworkInfo: {
    rpcCall: "getNetworkInfo", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "getnetworkinfo"
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command"]
  },
  getNetTotals: {
    rpcCall: "getNetTotals", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "getnettotals"
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command"]
  },
  getBestBlockHash: {
    rpcCall: "getBestBlockHash", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "getbestblockhash",
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command"]
  },
  getBlockHash: {
    rpcCall: "getBlockHash", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "getblockhash",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      index: null
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command", "index"]
  },
  getTXOutSetInfo: {
    rpcCall: "getTXOutSetInfo", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "gettxoutsetinfo",
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command"]
  },
  listReceivedByAddress: {
    rpcCall: "listReceivedByAddress", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "listreceivedbyaddress",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      minimumConfirmations: 0,
      includeEmpty: true
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command", "minimumConfirmations", "includeEmpty"]
  },
  getMiningInfo: {
    rpcCall: "getMiningInfo", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "getmininginfo",
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command"],
    easyAccessControlOrigin: true
  },
  getGenerate: {
    rpcCall: "getGenerate", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "getgenerate",
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command"]
  },
  getMemoryInfo: {
    rpcCall: "getMemoryInfo", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "getmemoryinfo",
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command"]
  },
  getMemoryPoolArrivalTimes: {
    rpcCall: "getMemoryPoolArrivalTimes", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "getmemorypoolarrivaltimes",
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command"],
    easyAccessControlOrigin: true
  },
  getPerformanceProfile: {
    rpcCall: "getPerformanceProfile", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "getperformanceprofile",
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command"]
  },
  getInfo: {
    rpcCall: "getInfo", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "getinfo",
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command"]
  },
  generateToAddress: {
    rpcCall: "generateToAddress", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "generatetoaddress",
    },
    mandatoryModifiableArguments: {
      numberOfBlocks: 100, 
      address: null,
      maxTries: 1000000,
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command", "numberOfBlocks", "address", "maxTries"]
  },
  listUnspent: {
    rpcCall: "listUnspent", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "listunspent",
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command"]
  },
  listTransactions: {
    rpcCall: "listTransactions", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "listtransactions",
    },
    optionalModifiableArguments: {
      count: null
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command", "count"]
  },
  getTransaction: {
    rpcCall: "getTransaction", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "gettransaction",
    },
    mandatoryModifiableArguments: {
      txid: null
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command", "txid"]
  },
  decodeRawTransaction: {
    rpcCall: "decodeRawTransaction", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "decoderawtransaction",
    },
    mandatoryModifiableArguments: {
      rawTransaction: null
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command", "rawTransaction"]
  },
  dumpPrivateKey: {
    rpcCall: "dumpPrivateKey", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "dumpprivkey",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      address: null
    },
    allowedArgumentValues: {
      net: [ //<- restricted network access!
        networkData.testNetNoDNS.rpcOption, 
        networkData.regtest.rpcOption
      ]
    },
    address: "",
    cli: ["net", "command", "address"]
  },
  getAccountAddress: {
    rpcCall: "getAccountAddress", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "getaccountaddress",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      account: null
    },
    allowedArgumentValues: {
      net: [ //<- restricted network access!
        networkData.regtest.rpcOption,
        networkData.testNetNoDNS.rpcOption,
        networkData.testNet.rpcOption 
      ]
    },
    address: "",
    cli: ["net", "command", "account"]
  },
  getTXOut: {
    rpcCall: "getTXOut", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "gettxout",
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command"]
  },
  getBalance: {
    rpcCall: "getBalance", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "getbalance",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      account: null
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command", "account"]
  },
  listAccounts: {
    rpcCall: "listAccounts", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "listaccounts",
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command"]
  }, 
  sendRawTransaction: {
    rpcCall: "sendRawTransaction",
    mandatoryFixedArguments: {
      command: "sendrawtransaction"
    },
    mandatoryModifiableArguments: {
      rawTransaction: null
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command", "rawTransaction"]
  }, 
  sendBulkRawTransactions: {
    rpcCall: "sendBulkRawTransactions",
    mandatoryFixedArguments: {
      command: "sendbulkrawtransactions"
    },
    mandatoryModifiableArguments: {
      rawTransactions: null
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command", "rawTransactions"]
  }
};

var rpcCallsBannedUnlessSecurityRelaxed = {};
rpcCallsBannedUnlessSecurityRelaxed[rpcCalls.dumpPrivateKey.command] = true;

var fabcoinInitializationOLD = "fabcoinInitializationOLD";
var rpcCall = "rpcCall";

var forceRPCPOST = "forceRPCPOST";

var allowedArgumentValuesDefaults = {
  net: [
    networkData.regtest.rpcOption, 
    networkData.testNetNoDNS.rpcOption,
    networkData.testNet.rpcOption,
    networkData.mainNet.rpcOption
  ]
};

var allowedArgumentValuesKanbanDefaults = {
  net: [
    networkDataKanbanProofOfConcept.testKanban.rpcOption, 
    networkData.mainNet.rpcOption
  ]
};

var pathsComputedAtRunTime = {
  fabcoinConfigurationFolder: null,
  kanbanProofOfConcentConfigurationFolder: null
};

var networkSecurityByRPCOption = {}; //<- for convenience
var networkRPCOption = {}; //<- for convenience
var networkNameByRPCNetworkOption = {}; //<- for convenience
for (var label in networkData) {
  networkSecurityByRPCOption[networkData[label].rpcOption] = networkData[label].security;
  networkRPCOption[label] = networkData[label].rpcOption;
  networkNameByRPCNetworkOption[networkData[label].rpcOption] = label;
}

function getNetworkDataFromRPCNetworkOption(RPCNetworkOption) {
  return networkData[networkNameByRPCNetworkOption[RPCNetworkOption]];
}

function getURLfromComputationalEngineCall(theComputationalEngineCallLabel, additionalArguments) {
  var theComputationalEngineCall = computationalEngineCalls[theComputationalEngineCallLabel];
  if (theComputationalEngineCall === undefined){
    throw(`Node call ${theComputationalEngineCallLabel} not registered in the computationalEngineCalls data structure. `);
  }
  var theRequest = {};
  theRequest[computationalEngineCall] = theComputationalEngineCallLabel;
  if (typeof additionalArguments === "object") {
    for (var label in additionalArguments) {
      theRequest[label] = additionalArguments[label];
    }
  }
  if (theComputationalEngineCall.required !== undefined) {
    for (var counterRequiredArguments = 0; counterRequiredArguments < theComputationalEngineCall.required.length; counterRequiredArguments ++) {
      if (!(theComputationalEngineCall.required[counterRequiredArguments] in theRequest)) {
        throw (`Mandatory argument ${theComputationalEngineCall.required[counterRequiredArguments]} missing.`);
      }
    }
  }
  return `${url.known.node}?command=${encodeURIComponent(JSON.stringify(theRequest))}`;
}

function getPOSTBodyfromRPCLabel(theRPClabel, theArguments, isKanban) {
  var theRequest = {};
  var callCollection = rpcCalls;
  if (isKanban) {
    callCollection = rpcCallsKanban
  }
  var theRPCCall = callCollection[theRPClabel];
  theRequest[rpcCall] = theRPClabel;
  theRequest["command"] = theRPCCall.command;
  if (theArguments === undefined) {
    theArguments = {};
  }
  for (var label in theArguments) {
    if (typeof theArguments[label] !== "string") {
      //console.log(`Warning: non-string value ${theArguments[label]} for label ${label} in rpc arguments. Is this expected? `);
      //continue; // <- label not valid for this RPC call
    }
    theRequest[label] = theArguments[label];
  }
  theRequest.forceRPCPOST = false;
  if (window !== null && window !== undefined) {
    if (window.kanban.rpc[forceRPCPOST]) {
      theRequest[forceRPCPOST] = true;
    }
  }
  return `command=${encodeURIComponent(JSON.stringify(theRequest))}`;
}

function getURLfromRPCLabel(theRPClabel, theArguments, isKanban) {
  var entryPoint = url.known.fabcoinOldRPC;
  if (isKanban === true) {
    entryPoint = url.known.kanbanRPC;
  }
  return `${entryPoint}?${getPOSTBodyfromRPCLabel(theRPClabel, theArguments, isKanban)}`;
}

function getRPCNet(theArguments) {
  if (typeof theArguments.length !== "number") {
    return networkData.mainNet.rpcOption;
  }
  if (theArguments.length > 10) {
    return networkData.mainNet.rpcOption;
  }
  var bestNetworkSoFar = "";
  for (var counterArguments = 0 ; counterArguments < theArguments.length; counterArguments ++) {
    var currentNetCandidate = theArguments[counterArguments];
    if (currentNetCandidate in networkSecurityByRPCOption) {
      if (bestNetworkSoFar == "") {
        bestNetworkSoFar = currentNetCandidate;
      } else {
        if (networkSecurityByRPCOption[bestNetworkSoFar] < networkSecurityByRPCOption[currentNetCandidate]) {
          currentNetCandidate = bestNetworkSoFar;
        }
      }
    }
  }
  if (bestNetworkSoFar === "") {
    bestNetworkSoFar = networkData.mainNet.rpcOption;
  }
  return bestNetworkSoFar;
}

function hasRelaxedNetworkSecurity(networkRPCOption) {
  if (!(networkRPCOption in networkSecurityByRPCOption)) {
    return false;
  }
  return networkSecurityByRPCOption[networkRPCOption] < networkData.testNet.security;
}

function isAllowedRPCCallArgument(theRPCCall, argumentLabel, argumentValue, errors, isKanban) {
  var allowedArgumentValues = theRPCCall.allowedArgumentValues;
  if (!(argumentLabel in allowedArgumentValues)) {
    return true;
  }
  var currentAllowedValues = allowedArgumentValues[argumentLabel];
  if (currentAllowedValues === null) {
    var defaults = allowedArgumentValuesDefaults;
    if (isKanban) {
      defaults = allowedArgumentValuesKanbanDefaults;
    }
    currentAllowedValues = defaults[argumentLabel];
  }
  for (var counterAllowed = 0; counterAllowed < currentAllowedValues.length; counterAllowed ++) {
    if (argumentValue === currentAllowedValues[counterAllowed]) {
      return true;
    }
  }
  errors.push( 
    `Variable <b>${argumentLabel}</b> not allowed to take on value <b>${argumentValue}</b> in command <b>${theRPCCall.rpcCall}</b>. ` +
    `The allowed values are ${currentAllowedValues.join(', ')}.`
  );
  return false;
}

var allowedCharsInRPCArgumentsArray = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890+/_=-,";
var allowedCharsInRPCArgumentsObject = {};
for (var counterAllowed = 0; counterAllowed < allowedCharsInRPCArgumentsArray.length; counterAllowed ++) {
  allowedCharsInRPCArgumentsObject[allowedCharsInRPCArgumentsArray[counterAllowed]] = true;
}

/*var rpcArgumentsRquiredToBeArrays = {
  rawTransactions: true
};
*/
var rpcArgumentsAllowedToBeLong = {
  rawTransaction: true,
  rawTransactions: true
};

function isValidRPCArgumentBasicChecks(label, input, errors, recursionDepth) {
/*  if (label in rpcArgumentsRquiredToBeArrays) {
    if (!Array.isArray(input)) {
      errors.push(`Input with label ${label} required to be an array. `);
      return false;  
    }
    if (input.length > 1000000) {
      errors.push(`Input label ${label} of length: ${input.length} is too long (max 1 million). `);
      return false;
    }
    if (recursionDepth === undefined) {
      recursionDepth = 0;
    }
    if (recursionDepth > 1000) {
      errors.push(`Input label ${label} too deeply nested. `);
      return false;
    }
    for (var counterInput = 0; counterInput < input.length; counterInput ++) {
      if (!isValidRPCArgumentBasicChecks(`${label}.${counterInput}`, input[counterInput], errors, recursionDepth + 1)) {
        return false;
      }
    }
    return true;
  }*/
  if (typeof input !== "string") {
    return true;
    //errors.push(`Input with label ${label} must be a string. `);
    //return false;
  }
  var maxLength = 1000;
  if (input.length > maxLength) {
    if (label in rpcArgumentsAllowedToBeLong) {
      return true;
    }
    errors.push(`Input with label ${label} of length ${input.length} is too long (max ${maxLength}). `);
    return false;
  }
  for (var counterInput = 0; counterInput < input.length; counterInput ++) {
    if (!(input[counterInput] in allowedCharsInRPCArgumentsObject)) {
      errors.push(`Input with label ${label} contains the forbidden character ${input[counterInput]} at position ${counterInput}.`);
    }
  }
  return true;
}

function getRPCJSON(theRPCLabel, additionalArguments, inputId, errors, isKanban) {
  var callCollection = rpcCalls;
  if (isKanban) {
    callCollection = rpcCallsKanban;
  }
  if (!(theRPCLabel in callCollection)) {
    errors.push(`Uknown or non-implemented rpc command: ${theRPCLabel}.`);
    return null;
  }
  var netName = networkData.mainNet.name;
  var portComputed = networkData.mainNet.rpcPort;
  if ("net" in additionalArguments) {
    var netOption = additionalArguments.net;
    if (netOption in networkNameByRPCNetworkOption) {
      netName = networkNameByRPCNetworkOption[netOption]; 
      portComputed = networkData[netName].rpcPort;
    }
  }
  var result = { 
    request: {
      id: inputId,
      method: callCollection[theRPCLabel].mandatoryFixedArguments.command,
      params: []
    },
    port: portComputed,
    network: netName
  }
  var excludeArguments = {
    "net": true,
    "command": true
  }
  if (!getRPCcallCommon(theRPCLabel, additionalArguments, errors, result.request.params, excludeArguments, isKanban)) {
    return null;
  }
  return result;
}

function getRPCcallCommon(theRPCLabel, additionalArguments, errors, outputArray, excludeFromOutput, isKanban) {
  if (!Array.isArray(outputArray)) {
    console.log("Fatal error: called getRPCcallCommon with outputArray not of type array. ");
    assert(false);
  }
  var callCollection = rpcCalls;
  if (isKanban) {
    callCollection = rpcCallsKanban;
  }
  var theRPCCall = callCollection[theRPCLabel];
  var theRPCcli = theRPCCall.cli;
  var mandatoryFixedArguments = theRPCCall.mandatoryFixedArguments;
  var mandatoryModifiableArguments = theRPCCall.mandatoryModifiableArguments;
  var optionalModifiableArguments = theRPCCall.optionalModifiableArguments;

  for (var counterCommand = 0; counterCommand < theRPCcli.length; counterCommand ++) {
    var currentLabel = theRPCcli[counterCommand];
    if (currentLabel in excludeFromOutput) {
      continue;
    }
    if (currentLabel in mandatoryFixedArguments) {
      outputArray.push(mandatoryFixedArguments[currentLabel]);
      continue;
    }
    var currentValueCandidate = null;
    if (optionalModifiableArguments !== undefined) {
      if (currentLabel in optionalModifiableArguments) {
        if (optionalModifiableArguments[currentLabel] !== null) {
          currentValueCandidate = optionalModifiableArguments[currentLabel];
        }
      }
    }
    var isMandatory = false;
    if (mandatoryModifiableArguments !== undefined) {
      if (currentLabel in mandatoryModifiableArguments) {
        isMandatory = true;
        if (mandatoryModifiableArguments[currentLabel] !== null) {
          currentValueCandidate = mandatoryModifiableArguments[currentLabel];
        }
      }
    }
    if (currentLabel in additionalArguments) {
      currentValueCandidate = additionalArguments[currentLabel];
    }
    if (currentValueCandidate === null) {
      if (isMandatory) {
        errors.push(`Could not extract mandatory variable with label ${currentLabel} in rpc call labeled ${theRPCLabel}.`);
        return false;
      }
      continue;
    }
    if (!isAllowedRPCCallArgument(theRPCCall, currentLabel, currentValueCandidate, errors, isKanban)) {
      return false;
    }
    if (!isValidRPCArgumentBasicChecks(currentLabel, currentValueCandidate, errors)) {
      return false;
    }
    //console.log(`DEBUG: value: ${JSON.stringify(currentValueCandidate)} looks ok. `);
    if (Array.isArray(currentValueCandidate)) {
      outputArray.push(JSON.stringify(currentValueCandidate));
    } else {
      outputArray.push(currentValueCandidate);
    }
  }
  return true;
}

function getRPCcallArguments(theRPCLabel, additionalArguments, errors, isKanban) {
  var result = [];
  var callCollection = rpcCalls;
  if (isKanban) {
    callCollection = rpcCallsKanban;
    result.push(`-datadir=${pathsComputedAtRunTime.kanbanProofOfConcentConfigurationFolder}/`);
  }
  if (!(theRPCLabel in callCollection)) {
    errors.push(`Uknown or non-implemented rpc command: ${theRPCLabel}.`);
    return null;
  }
  if (!getRPCcallCommon(theRPCLabel, additionalArguments, errors, result, {}, isKanban)) {
    return null;
  }
  return result;
}

module.exports = {
  networkData,
  networkRPCOption,
  networkDataKanbanProofOfConcept,
  pathsComputedAtRunTime
}