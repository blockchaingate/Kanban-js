"use strict";
const pathBuiltIn = require('path');

var path = {
  base: `${__dirname}/..`,
  certificates: `${__dirname}/../certificates_secret`,
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
  privateKey: `${path.certificates}/private_key.pem`,
  certificate: `${path.certificates}/certificate.pem`,
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
    faviconIco : "/favicon.ico",
    fabcoinSvg : "/fabcoin.svg",
    frontEndBrowserifiedJS: "/kanban_frontend_browserified.js",
    frontEndHTML: "/kanban_frontend.html",
    frontEndCSS: "/kanban_frontend.css",
    rpc: "/rpc",
    node: "/node",
    fabcoinInitialization: "/fabcoin_initialization",
    logFileTestNet: "/logFileTestNet",
    logFileMainNet: "/logFileMainNet"
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

var nodeCall = "nodeCall";

var nodeCallStatuses = {
  starting: "Starting",
  recentlyFinished: "Recently finished",
  notFound: "Not found"
};

var nodeCalls = {
  computeUnspentTransactions: {
    nodeCall: "computeUnspentTransactions", // must be same as key label, used for autocomplete
  }, 
  pollOngoing: {
    nodeCall: "pollOngoing" // must be same as key label, used for autocomplete
  },
  testGPUSha256: {
    nodeCall: "testGPUSha256" // must be same as key label, used for autocomplete
  },
  testBackEndSha256Multiple: {
    nodeCall: "testBackEndSha256Multiple" // must be same as key label, used for autocomplete
  },
  testBackEndSha256OneMessage: {
    nodeCall: "testBackEndSha256OneMessage" // must be same as key label, used for autocomplete
  },
  testBackEndPipeMultiple: {
    nodeCall: "testBackEndPipeMultiple" // must be same as key label, used for autocomplete
  },
  testBackEndPipeOneMessage: {
    nodeCall: "testBackEndPipeOneMessage" // must be same as key label, used for autocomplete
  },
  testBackEndSignOneMessage: {
    nodeCall: "testBackEndSignOneMessage" // must be same as key label, used for autocomplete
  },
  testBackEndSignMultipleMessages: {
    nodeCall: "testBackEndSignMultipleMessages" // must be same as key label, used for autocomplete
  },
  testBackEndEngineSha256: {
    nodeCall: "testBackEndEngineSha256" // must be same as key label, used for autocomplete
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

function getURLfromNodeCall(theNodeCallLabel, additionalArguments) {
  var theNodeCall = nodeCalls[theNodeCallLabel];
  if (theNodeCall === undefined){
    throw(`Node call ${theNodeCallLabel} not registered in the nodeCalls data structure. `);
  }
  var theRequest = {};
  theRequest[nodeCall] = theNodeCallLabel;
  if (typeof additionalArguments === "object") {
    for (var label in additionalArguments) {
      theRequest[label] = additionalArguments[label];
    }
  }
  if (theNodeCall.required !== undefined) {
    for (var counterRequiredArguments = 0; counterRequiredArguments < theNodeCall.required.length; counterRequiredArguments ++) {
      if (!(theNodeCall.required[counterRequiredArguments] in theRequest)) {
        throw (`Mandatory argument ${theNodeCall.required[counterRequiredArguments]} missing.`);
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

module.exports = {
  pathname,
  path,
  url,
  rpcCalls,
  nodeCalls,
  nodeCallStatuses,
  fabcoinInitializationProcedures,
  rpcCall,
  nodeCall,
  fabcoinInitialization,
  getURLfromRPCLabel,
  getURLfromNodeCall,
  getRPCcallArguments,
  getFabcoinInitializationCallArguments,
  gpuCommands
}
