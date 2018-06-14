"use strict";

var ports ={ 
  https: 52907,
  http: 51846
};

const pathBuiltIn = require('path');

var path = {
  base: `${__dirname}/..`,
  secretsServerOnly: `${__dirname}/../secrets_server_only`,
  secretsAdmin: `${__dirname}/../secrets_admin`,
  HTML: `${__dirname}/../html`,
  fabcoin: `${__dirname}/../fabcoin`,
  fabcoinSrc: `${__dirname}/../fabcoin/src`,
  openCLDriverBuildPath: `${__dirname}/../build`,
  fabcoinConfigurationFolder: null
};
for (var label in path) {
  //console.log(`Debug: path ${path[label]} `);
  if (path[label] === null) {
    continue;
  }
  path[label] = pathBuiltIn.normalize(path[label]);
//  console.log(`normalized to: ${path[label]}`);
}

var pathname = {
  privateKey: `${path.secretsServerOnly}/private_key.pem`,
  certificate: `${path.secretsServerOnly}/certificate.pem`,
  configurationSecretsAdmin: `${path.secretsAdmin}/configuration.json`,
  faviconIco: `${path.HTML}/favicon.ico`,
  fabcoinSvg: `${path.HTML}/fabcoin.svg`,
  frontEndBrowserifiedJS: `${path.HTML}/kanban_frontend_browserified.js`,
  frontEndNONBrowserifiedJS: `${__dirname}/frontend/frontend.js`,
  frontEndHTML: `${path.HTML}/kanban_frontend.html`,
  frontEndCSS: `${path.HTML}/kanban_frontend.css`,
  fabcoind: `${path.fabcoinSrc}/fabcoind`,
  fabcoinCli: `${path.fabcoinSrc}/fabcoin-cli`,
  openCLDriverExecutable: `${path.openCLDriverBuildPath}/kanban-gpu`
};

for (var label in pathname) {
  //console.log(`Debug: path ${pathname[label]} `);
  pathname[label] = pathBuiltIn.normalize(pathname[label]);
  //console.log(`normalized to: ${pathname[label]}`);
}
  
var url = {
  known: {
    ping: "/ping",
    faviconIco: "/favicon.ico",
    fabcoinSvg: "/fabcoin.svg",
    frontEndBrowserifiedJS: "/kanban_frontend_browserified.js",
    frontEndHTML: "/kanban_frontend.html",
    frontEndCSS: "/kanban_frontend.css",
    rpc: "/rpc",
    computationEngine: "/computation_engine",
    fabcoinInitialization: "/fabcoin_initialization",
    myNodesCommand: "/my_nodes",
    logFileTestNetNoDNS: "/logFileTestNetNoDNS",
    logFileTestNetNoDNSSession: "/logFileTestNetSessionNoDNS",
    logFileTestNet: "/logFileTestNet",
    logFileTestNetSession: "/logFileTestNetSession",
    logFileMainNet: "/logFileMainNet",
    logFileMainNetSession: "/logFileMainNetSession",
  },
  whiteListed: {

  }
};

url.whiteListed = {};
url.whiteListed[url.known.faviconIco] = pathname.faviconIco;
url.whiteListed[url.known.fabcoinSvg] = pathname.fabcoinSvg;
url.whiteListed[url.known.frontEndBrowserifiedJS] = pathname.frontEndBrowserifiedJS;
url.whiteListed[url.known.frontEndHTML] = pathname.frontEndHTML;
url.whiteListed[url.known.frontEndCSS] = pathname.frontEndCSS;


url.synonyms = {
  "/" : url.known.frontEndHTML
};

var computationalEngineCall = "computationalEngineCall";

var computationalEngineCallStatuses = {
  starting: "Starting",
  recentlyFinished: "Recently finished",
  notFound: "Not found"
};

var computationalEngineCalls = {
  computeUnspentTransactions: {
    computationalEngineCall: "computeUnspentTransactions", // must be same as key label, used for autocomplete
  }, 
  pollOngoing: {
    computationalEngineCall: "pollOngoing" // must be same as key label, used for autocomplete
  },
  testGPUSha256: {
    computationalEngineCall: "testGPUSha256" // must be same as key label, used for autocomplete
  },
  testBackEndSha256Multiple: {
    computationalEngineCall: "testBackEndSha256Multiple" // must be same as key label, used for autocomplete
  },
  testBackEndSha256OneMessage: {
    computationalEngineCall: "testBackEndSha256OneMessage" // must be same as key label, used for autocomplete
  },
  testBackEndPipeMultiple: {
    computationalEngineCall: "testBackEndPipeMultiple" // must be same as key label, used for autocomplete
  },
  testBackEndPipeOneMessage: {
    computationalEngineCall: "testBackEndPipeOneMessage" // must be same as key label, used for autocomplete
  },
  testBackEndSignOneMessage: {
    computationalEngineCall: "testBackEndSignOneMessage" // must be same as key label, used for autocomplete
  },
  testBackEndSignMultipleMessages: {
    computationalEngineCall: "testBackEndSignMultipleMessages" // must be same as key label, used for autocomplete
  },
  testBackEndEngineSha256: {
    computationalEngineCall: "testBackEndEngineSha256" // must be same as key label, used for autocomplete
  }
};

var gpuCommands = {
  SHA256: "SHA256",
  testBuffer: "testBuffer",
  signOneMessage: "signOneMessage",
  verifyOneSignature: "verifyOneSignature"
};

var networkData = {
  regtest: {
    name: "regtest", //<-same as label, for autocomplete
    rpcOption: "-regtest",
    folder: "regtest/",
    security: 1,
    logFileLink: null
  },
  testNetNoDNS: {
    name: "testNetNoDNS", //<-same as label, for autocomplete
    rpcOption: "-testnetnodns",
    folder: "testnet_no_dns/",
    security: 10,
    logFileLink: url.known.logFileTestNetNoDNS
  },
  testNet: {
    name: "testNet", //<-same as label, for autocomplete
    rpcOption: "-testnet",
    folder: "testnet3/",
    security: 100,
    logFileLink: url.known.logFileTestNet,
  },
  mainNet: { 
    name: "mainNet", //<-same as label, for autocomplete
    rpcOption: "-mainnet",
    folder: "./",
    security: 1000,
    logFileLink: url.known.logFileMainNet,
  }
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

var rpcCall = "rpcCall";
/**
 * Use null for mandatory variables.
 * Use "" for optional variables.
 * The cli argument gives the order of the commands.
 */

var allowedArgumentValuesDefaults = {
  net: [
    networkData.regtest.rpcOption, 
    networkData.testNetNoDNS.rpcOption,
    networkData.testNet.rpcOption,
    networkData.mainNet.rpcOption
  ]
}

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
      command: "getblock"
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
    mandatoryArguments: { //<- values give defaults, null for none
      minimumConfirmations: '0',
      includeEmpty: 'true'
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
    cli: ["net", "command"]
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
  generateToAddress: {
    rpcCall: "generateToAddress", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "generatetoaddress",
    },
    mandatoryArguments: {
      numberOfBlocks: "100", 
      address: null,
      maxTries: "100000000",
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
  getReceivedByAccount: {
    rpcCall: "getReceivedByAccount", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "getreceivedbyaccount",
    },
    allowedArgumentValues: {
      net: null
    },
    cli: ["net", "command"]
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
  }
}

var rpcCallsBannedUnlessSecurityRelaxed = {};
rpcCallsBannedUnlessSecurityRelaxed[rpcCalls.dumpPrivateKey.command] = true;

var fabcoinInitialization = "fabcoinInitialization";

var pathsComputedAtRunTime = {
  fabcoinConfigurationFolder: null
}

//To be documented on request. Please email me/tell me in person if you want 
//me to document the structure below.
//Not doing it right away because I am still refactoring it heavily.  
var fabcoinInitializationProcedures = {
  startFabcoind: {
    fabcoinInitialization: "startFabcoind", //must be same as label, used for autocomplete
    command: pathname.fabcoind,
    allowedArgumentValues: {
      net: [networkRPCOption.regtest, networkRPCOption.testNetNoDNS, networkRPCOption.testNet],
      mine: ["", "-gen"]
    },
    cli: [ ["net", networkRPCOption.testNetNoDNS], ["mine", ""], "-daemon"] //when the argument is an array, the second is the default
  },
  killAll: {
    fabcoinInitialization: "killAll",
    command: "killall",
    cli: ["fabcoind"]
  },
  gitPullNode: {
    fabcoinInitialization: "gitPullNode",
    command: "git",
    path: path.base,
    cli: ["pull"]
  },
  gitPullFabcoin: {
    fabcoinInitialization: "gitPullFabcoin",
    command: "git",
    path: path.fabcoin,
    cli: ["pull"]
  },
  makeFabcoin: {
    fabcoinInitialization: "makeFabcoin",
    command: "make",
    path: path.fabcoin,
    cli: []
  },
  deleteFabcoinConfiguration: {
    fabcoinInitialization: "deleteFabcoinConfiguration",
    command: "rm",
    path: "fabcoinConfigurationFolder", //<- looked up from pathsComputedAtRunTime
    allowedArgumentValues: {
      folder: [networkData.regtest.folder, networkData.testNetNoDNS.folder]
    },
    cli: ["-r", ["folder", networkData.testNetNoDNS.folder]]
  }
}

var myNodesCommand = "myNodesCommand";

var myNodesCommands = {
  fetchNodeInfo: {
    myNodesCommand: "fetchNodeInfo", //must be same as label, used for autocomplete
  },
  sshNodeToOneRemoteMachineGitPull: {
    myNodesCommand: "sshNodeToOneRemoteMachineGitPull",
    cli: {
      machineName: null
    }
  },
  sshNodeToOneRemoteMachineDeleteFabcoinConfiguration: {
    myNodesCommand: "sshNodeToOneRemoteMachineDeleteFabcoinConfiguration",
    cli: {
      machineName: null
    }
  },
  sshNodeToOneRemoteMachineKillallFabcoind: {
    myNodesCommand: "sshNodeToOneRemoteMachineKillallFabcoind",
    cli: {
      machineName: null
    }
  },
  sshNodeToOneRemoteMachineNodeRestart: {
    myNodesCommand: "sshNodeToOneRemoteMachineNodeRestart",
    cli: {
      machineName: null
    }    
  },
  sshNodeToOneRemoteMachineStartFabcoind: {
    myNodesCommand: "sshNodeToOneRemoteMachineStartFabcoind",
    cli: {
      machineName: null,
      net: null
    }    
  }
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

function getURLfromRPCLabel(theRPClabel, theArguments) {
  var theRequest = {};
  var theRPCCall = rpcCalls[theRPClabel];
  theRequest[rpcCall] = theRPClabel;
  theRequest["command"] = theRPCCall.command;
  if (theArguments === undefined) {
    theArguments = {};
  }
  for (var label in theArguments) {
    if (typeof theRPCCall[label] !== "string" && theRPCCall[label] !== null) {
      continue; // <- label not valid for this RPC call
    }
    if (typeof theArguments[label] === "string") {
      theRequest[label] = theArguments[label];
    } 
  }
  return `${url.known.rpc}?command=${encodeURIComponent(JSON.stringify(theRequest))}`;
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

function isAllowedRPCCallArgument(theRPCCall, argumentLabel, argumentValue, errors) {
  var allowedArgumentValues = theRPCCall.allowedArgumentValues;
  if (!(argumentLabel in allowedArgumentValues)) {
    return true;
  }
  var currentAllowedValues = allowedArgumentValues[argumentLabel];
  if (currentAllowedValues === null) {
    currentAllowedValues = allowedArgumentValuesDefaults[argumentLabel];
  }
  for (var counterAllowed = 0; counterAllowed < currentAllowedValues.length; counterAllowed ++) {
    if (argumentValue === currentAllowedValues[counterAllowed]) {
      return true;
    }
  }
  errors.push( 
    `Value ${argumentValue} not allowed as input with name ${argumentLabel} of command ${theRPCCall.rpcCall}.
    The allowed values are ${currentAllowedValues.join(', ')}. `
  );
  return false;
}

var allowedCharsInRPCArgumentsArray = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-1234567890";
var allowedCharsInRPCArgumentsObject = {};
for (var counterAllowed = 0; counterAllowed < allowedCharsInRPCArgumentsArray.length; counterAllowed ++) {
  allowedCharsInRPCArgumentsObject[counterAllowed] = true;
}

function isValidRPCArgumentInTermsOfCharacters(label, input, errors) {
  if (typeof input !== "string") {
    errors.push(`Input with label ${label} must be a string. `);
    return false;
  }
  if (input.length > 1000) {
    errors.push(`Input with label ${label} of length ${input.length} is too long. `);
    return false;
  }
  for (var counterInput = 0; counterInput < input.length; counterInput ++) {
    if (!(input[counterInput] in allowedCharsInRPCArgumentsObject)) {
      errors.push(`Input with label ${label} contains the forbidden character ${input[counterInput]} at position ${counterInput}.`);
      return false;
    }
  }
  return true;
}

function getRPCcallArguments(theRPCLabel, additionalArguments, errors) {
  var result = [];
  if (!(theRPCLabel in rpcCalls)) {
    errors.push(`Uknown or non-implemented rpc command: ${theRPCLabel}.`);
    return null;
  }
  var theRPCCall = rpcCalls[theRPCLabel];
  var theRPCcli = theRPCCall.cli;
  var mandatoryFixedArguments = theRPCCall.mandatoryFixedArguments;
  var mandatoryModifiableArguments = theRPCCall.mandatoryModifiableArguments;
  var optionalModifiableArguments = theRPCCall.optionalModifiableArguments;

  for (var counterCommand = 0; counterCommand < theRPCcli.length; counterCommand ++) {
    var currentLabel = theRPCcli[counterCommand];
    if (currentLabel in mandatoryFixedArguments) {
      result.push(mandatoryFixedArguments[currentLabel]);
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
        return null;
      }
      continue;
    }
    if (!isAllowedRPCCallArgument(theRPCCall, currentLabel, currentValueCandidate, errors)) {
      return null;
    }
    if (!isValidRPCArgumentInTermsOfCharacters(currentLabel, currentValueCandidate, errors)) {
      return null;
    }
    result.push(currentValueCandidate);
  }
  return result;
}

function isAllowedArgumentForFabInitialization(theInitCall, theLabel, theValue, errors) {
  if (theInitCall.allowedArgumentValues === undefined) {
    return true;
  }
  if (!(theLabel in theInitCall.allowedArgumentValues)) {
    return true;
  }
  var currentAllowedValues = theInitCall.allowedArgumentValues[theLabel];
  for (var counterAllowed = 0; counterAllowed < currentAllowedValues.length; counterAllowed ++) {
    if (theValue === currentAllowedValues[counterAllowed]) {
      return true;
    }
  }
  errors.push( 
    `Value ${theValue} not allowed as input with name ${theLabel} of command ${theInitCall.fabcoinInitialization}.
    The allowed values are ${currentAllowedValues.join(', ')}. `
  );
  return false;
}

function getFabcoinInitializationCallArguments(theCallLabel, additionalArguments, errors) {
  console.log("DEBUG: extracting additional arguments from: " + JSON.stringify(additionalArguments));
  var result = [];
  if (!(theCallLabel in fabcoinInitializationProcedures)) {
    errors.push(`Uknown or non-implemented rpc command: ${theCallLabel}.`);
    return null;
  }
  var theInitCall = fabcoinInitializationProcedures[theCallLabel];

  for (var counterCommand = 0; counterCommand < theInitCall.cli.length; counterCommand ++) {
    var currentArgument = theInitCall.cli[counterCommand];
    if (typeof currentArgument === "string") {
      result.push(currentArgument);
      continue;
    }
    var currentLabel = currentArgument[0];
    var currentValue = currentArgument[1];
    if (currentLabel in additionalArguments) {
      currentValue = additionalArguments[currentLabel];
    }
    if (!isAllowedArgumentForFabInitialization(theInitCall, currentLabel, currentValue, errors)) {
      return;
    }
    if (currentValue !== "" && typeof currentValue === "string") {
      result.push(currentValue);
    }
  }
  return result;
}

function getURLFromFabcoinInitialization(theCallLabel, theArguments) {
  var theRequest = {};
  theRequest[fabcoinInitialization] = theCallLabel;
  for (var label in theArguments) {
    theRequest[label] = theArguments[label];
  }
  return `${url.known.fabcoinInitialization}?command=${encodeURIComponent(JSON.stringify(theRequest))}`;
}

function getURLFromMyNodesCall(theMyNodesCallLabel, theArguments) {
  var theRequest = {};
  theRequest[myNodesCommand] = theMyNodesCallLabel;
  var theMyNodesCall = myNodesCommands[theMyNodesCallLabel];
  if (theArguments === undefined) {
    theArguments = {};
  }
  for (var label in theArguments) {
    if (typeof theArguments[label] !== "string") {
      continue; // <- label not valid for this RPC call
    }
    if (!(label in theMyNodesCall.cli)) {
      console.log(`Warning: label: ${label} is not listed in the ${theMyNodesCallLabel}.cli object.`);
      continue;
    }
    if (typeof theArguments[label] === "string") {
      theRequest[label] = theArguments[label];
    } 
  }
  return `${url.known.myNodesCommand}?command=${encodeURIComponent(JSON.stringify(theRequest))}`;
}

module.exports = {
  pathname,
  path,
  pathsComputedAtRunTime,
  ports,
  url,
  computationalEngineCallStatuses,
  networkData,
  hasRelaxedNetworkSecurity,
  ///////////////
  //information on the various calls:
  rpcCalls,
  rpcCallsBannedUnlessSecurityRelaxed,
  computationalEngineCalls,
  fabcoinInitializationProcedures,
  myNodesCommands,
  ///////////////
  //label for the various type of command:
  rpcCall,
  computationalEngineCall,
  fabcoinInitialization,
  myNodesCommand,
  ///////////////
  getNetworkDataFromRPCNetworkOption,
  getURLfromRPCLabel,
  getURLfromComputationalEngineCall,
  getURLFromMyNodesCall,
  getURLFromFabcoinInitialization,
  getRPCcallArguments,
  getRPCNet,
  getFabcoinInitializationCallArguments,
  gpuCommands,
}
