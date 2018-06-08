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
    net: "-testnet",
    cli: ["net", "command"]
  },
  getNetworkInfo: {
    rpcCall: "getNetworkInfo", //must be same as rpc label, used for autocomplete
    command: "getnetworkinfo",
    net: "-testnet",
    cli: ["net", "command"]
  },
  getNetTotals: {
    rpcCall: "getNetTotals", //must be same as rpc label, used for autocomplete
    command: "getnettotals",
    net: "-testnet",
    cli: ["net", "command"]
  },
  getBlock: {
    rpcCall: "getBlock", //must be same as rpc label, used for autocomplete
    command: "getblock",
    blockHash: null, // mandatory input
    net: "-testnet",
    verbosity: null, // mandatory input
    cli: ["net", "command", "blockHash", "verbosity"]
  },
  getBestBlockHash: {
    rpcCall: "getBestBlockHash", //must be same as rpc label, used for autocomplete
    command: "getbestblockhash",
    net: "-testnet",
    cli: ["net", "command"]
  },
  getBlockHash: {
    rpcCall: "getBlockHash", //must be same as rpc label, used for autocomplete
    command: "getblockhash",
    index: "index",
    net: "-testnet",
    cli: ["net", "command", "index"]
  },
  getTXOutSetInfo: {
    rpcCall: "getTXOutSetInfo", //must be same as rpc label, used for autocomplete
    command: "gettxoutsetinfo",
    net: "-testnet",
    cli: ["net", "command"]
  },
  listUnspent: {
    rpcCall: "listUnspent", //must be same as rpc label, used for autocomplete
    command: "listunspent",
    net: "-testnet",
    cli: ["net", "command"]
  },
  getTXOut: {
    rpcCall: "getTXOut", //must be same as rpc label, used for autocomplete
    command: "gettxout",
    net: "-testnet",
    cli: ["net", "command"]
  },
  getReceivedByAccount: {
    rpcCall: "getReceivedByAccount", //must be same as rpc label, used for autocomplete
    command: "getreceivedbyaccount",
    net: "-testnet",
    cli: ["net", "command"]
  },
  listAccounts: {
    rpcCall: "listAccounts", //must be same as rpc label, used for autocomplete
    command: "listaccounts",
    net: "-testnet",
    cli: ["net", "command"]
  }
}

var fabcoinInitialization = "fabcoinInitialization";
var fabcoinInitializationProcedures = {
  startFabcoind: {
    fabcoinInitialization: "startFabcoind", //must be same as label, used for autocomplete
    command: pathname.fabcoind,
    cli: [ ["net", "-testnet"], "-daemon"]
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
  }
}

var myNodesCommand = "myNodesCommand";

var myNodesCommands = {
  fetchNodeInfo : {
    myNodesCommand: "fetchNodeInfo", //must be same as label, used for autocomplete
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

function getRPCcallArguments(theRPCLabel, additionalArguments, errors) {
  var result = [];
  if (!(theRPCLabel in rpcCalls)){
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

function getURLFromFabcoinInitialization(theNodeCallLabel, theArguments) {
}

function getURLFromMyNodesCall(theMyNodesCallLabel, theArguments) {
  var theRequest = {};
  theRequest[myNodesCommand] = theMyNodesCallLabel;
  var theMyNodesCall = myNodesCommands[theMyNodesCallLabel];
  if (theArguments === undefined) {
    theArguments = {};
  }
  for (var label in theArguments) {
    if (typeof theArguments[label] !== "string" && theMyNodesCall[label] !== null) {
      continue; // <- label not valid for this RPC call
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
  ///////////////
  //information on the various calls:
  rpcCalls,
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
  getURLfromRPCLabel,
  getURLfromComputationalEngineCall,
  getURLFromMyNodesCall,
  getURLFromFabcoinInitialization,
  getRPCcallArguments,
  getFabcoinInitializationCallArguments,
  gpuCommands,
}
