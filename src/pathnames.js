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
var rpcCalls = {
  getPeerInfo: {
    rpcCall: "getPeerInfo", //must be same as rpc label, used for autocomplete
    command: "getpeerinfo",
    allowedArgumentValues: {
      net: [
        networkData.regtest.rpcOption, 
        networkData.testNetNoDNS.rpcOption,
        networkData.testNet.rpcOption,
        networkData.mainNet.rpcOption
      ]
    },
    cli: ["net", "command"]
  },
  getNetworkInfo: {
    rpcCall: "getNetworkInfo", //must be same as rpc label, used for autocomplete
    command: "getnetworkinfo",
    cli: ["net", "command"]
  },
  getNetTotals: {
    rpcCall: "getNetTotals", //must be same as rpc label, used for autocomplete
    command: "getnettotals",
    cli: ["net", "command"]
  },
  getBlock: {
    rpcCall: "getBlock", //must be same as rpc label, used for autocomplete
    command: "getblock",
    allowedArgumentValues: {
      net: [
        networkData.regtest.rpcOption, 
        networkData.testNetNoDNS.rpcOption,
        networkData.testNet.rpcOption,
        networkData.mainNet.rpcOption
      ]
    },
    mandatoryArguments: { //<- values give defaults, null for none
      blockHash: null,
      verbosity: null
    },
    cli: ["net", "command", "blockHash", "verbosity"]
  },
  getBestBlockHash: {
    rpcCall: "getBestBlockHash", //must be same as rpc label, used for autocomplete
    command: "getbestblockhash",
    cli: ["net", "command"]
  },
  getBlockHash: {
    rpcCall: "getBlockHash", //must be same as rpc label, used for autocomplete
    command: "getblockhash",
    index: "index",
    cli: ["net", "command", "index"]
  },
  getTXOutSetInfo: {
    rpcCall: "getTXOutSetInfo", //must be same as rpc label, used for autocomplete
    command: "gettxoutsetinfo",
    cli: ["net", "command"]
  },
  listReceivedByAddress: {
    rpcCall: "listReceivedByAddress", //must be same as rpc label, used for autocomplete
    command: "listreceivedbyaddress",
    mandatoryArguments: { //<- values give defaults, null for none
      minimumConfirmations: '0',
      includeEmpty: 'true'
    },
    cli: ["net", "command", "minimumConfirmations", "includeEmpty"]
  },
  getMiningInfo: {
    rpcCall: "getMiningInfo", //must be same as rpc label, used for autocomplete
    command: "getmininginfo",
    cli: ["net", "command"]
  },
  getGenerate: {
    rpcCall: "getGenerate", //must be same as rpc label, used for autocomplete
    command: "getgenerate",
    cli: ["net", "command"]
  },
  generateToAddress: {
    rpcCall: "generateToAddress", //must be same as rpc label, used for autocomplete
    command: "generatetoaddress",
    mandatoryArguments: {
      numberOfBlocks: "100", 
      address: null,
      maxTries: "100000000",
    },
    cli: ["net", "command", "numberOfBlocks", "address", "maxTries"]
  },
  listUnspent: {
    rpcCall: "listUnspent", //must be same as rpc label, used for autocomplete
    command: "listunspent",
    cli: ["net", "command"]
  },
  dumpPrivateKey: {
    rpcCall: "dumpPrivateKey", //must be same as rpc label, used for autocomplete
    command: "dumpprivkey",
    address: "",
    cli: ["net", "command", "address"]
  },
  getTXOut: {
    rpcCall: "getTXOut", //must be same as rpc label, used for autocomplete
    command: "gettxout",
    cli: ["net", "command"]
  },
  getReceivedByAccount: {
    rpcCall: "getReceivedByAccount", //must be same as rpc label, used for autocomplete
    command: "getreceivedbyaccount",
    cli: ["net", "command"]
  },
  listAccounts: {
    rpcCall: "listAccounts", //must be same as rpc label, used for autocomplete
    command: "listaccounts",
    cli: ["net", "command"]
  }
}

var rpcCallsBannedUnlessSecurityRelaxed = {};
rpcCallsBannedUnlessSecurityRelaxed[rpcCalls.dumpPrivateKey.command] = true;

var fabcoinInitialization = "fabcoinInitialization";

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
    cli: [ ["net", networkRPCOption.testNetNoDNS], ["mine", ""], "-daemon"] 
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
    path: "~/",
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
  theRequest[rpcCall] = theRPClabel;
  var theRPCCall = rpcCalls[theRPClabel];
  for (var label in theRPCCall) {
    if (typeof theRPCCall[label] === "string") {
      theRequest[label] = theRPCCall[label]
    } 
  }
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

function getRPCcallArguments(theRPCLabel, additionalArguments, errors) {
  var result = [];
  if (!(theRPCLabel in rpcCalls)) {
    errors.push(`Uknown or non-implemented rpc command: ${theRPCLabel}.`);
    return null;
  }
  var theRPCCall = rpcCalls[theRPCLabel];
  for (var counterCommand = 0; counterCommand < theRPCCall.cli.length; counterCommand ++) {
    var currentLabel = theRPCCall.cli[counterCommand];
    if (!(currentLabel in additionalArguments)) {
      if (!(currentLabel in theRPCCall)) {
        console.log(`WARNING: no default given for ${currentLabel} in rpc call labeled ${theRPCLabel}. If this is an optional argument, set the default to an empty string.`.red);
        continue;
      }
      if (typeof theRPCCall[currentLabel] === null) {
        errors.push(`Mandatory argument ${currentLabel} missing for rpc command: ${theRPCLabel}`);
        return null;
      }
      if (theRPCCall[currentLabel] === "") {
        continue;
      }
      result.push(theRPCCall[currentLabel]);
    } else {
      if (typeof additionalArguments[currentLabel] === "string") {
        if (additionalArguments[currentLabel] !== "") {
          result.push(additionalArguments[currentLabel]);
          //console.log(`Pusing label ${currentLabel} with value: ${additionalArguments[currentLabel]}.`);
        } 
      }
    }
  }
  return result;
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
    if (currentValue !== "" && typeof currentValue === "string") {
      result.push(currentValue);
    }
  }
  return result;
}

function getURLFromFabcoinInitialization(theCallLabel, theArguments) {
  var result = "";
  result += `${url.known.fabcoinInitialization}?command={"${fabcoinInitialization}":"${theCallLabel}"`;
  var currentCall = fabcoinInitializationProcedures[theCallLabel];
  for (var label in theArguments) {
    result += `,"${label}":"${theArguments[label]}"`
  }
  result += "}";
  return result;
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
