"use strict";

var path = {
  base: `${__dirname}/..`,
  certificates: `${__dirname}/../certificates_secret`,
  HTML: `${__dirname}/../html`,
  fabcoin: `${__dirname}/../../fabcoin-dev`,
  fabcoinSrc: `${__dirname}/../../fabcoin-dev/src`,
};

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
  openCLDriver: `${path.base}/build/kanban-gpu`
};

var url = {};
url.known = {
  faviconIco : "/favicon.ico",
  fabcoinSvg : "/fabcoin.svg",
  frontEndBrowserifiedJS: "/kanban_frontend_browserified.js",
  frontEndHTML: "/kanban_frontend.html",
  frontEndCSS: "/kanban_frontend.css",
  rpc: "/rpc",
  node: "/node"  
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

var nodeCallLabel = "nodeCallLabel";

var nodeCallStatuses = {
  starting: "Starting",
  recentlyFinished: "Recently finished",
  notFound: "Not found"
};

var nodeCalls = {
  computeUnspentTransactions: {
    nodeCallLabel: "computeUnspentTransactions", // must be same as key label, used for autocomplete
  }, 
  pollOngoing: {
    nodeCallLabel: "pollOngoing",
  },
  testGPUSha256: {
    nodeCallLabel: "testGPUSha256"
  },
  testPipe: {
    nodeCallLabel: "testPipe"
  },
  testPipeOneMessage: {
    nodeCallLabel: "testPipeOneMessage"
  }
};

var rpcCallLabel = "rpcCallLabel";
/**
 * Use null for mandatory variables.
 * Use "" for optional variables.
 * The cli argument gives the order of the commands.
 */
var rpcCalls = {
  getPeerInfo: {
    rpcCallLabel: "getPeerInfo", //must be same as rpc label, used for autocomplete
    command: "getpeerinfo",
    net: "-testnet",
    cli: ["net", "command"]
  },
  getBlock: {
    rpcCallLabel: "getBlock", //must be same as rpc label, used for autocomplete
    command: "getblock",
    blockHash: null, // mandatory input
    net: "-testnet",
    verbosity: null, // mandatory input
    cli: ["net", "command", "blockHash", "verbosity"]
  },
  getBestBlockHash: {
    rpcCallLabel: "getBestBlockHash", //must be same as rpc label, used for autocomplete
    command: "getbestblockhash",
    net: "-testnet",
    cli: ["net", "command"]
  },
  getBlockHash: {
    rpcCallLabel: "getBlockHash", //must be same as rpc label, used for autocomplete
    command: "getblockhash",
    index: "index",
    net: "-testnet",
    cli: ["net", "command", "index"]
  },
  getTXOutSetInfo: {
    rpcCallLabel: "getTXOutSetInfo", //must be same as rpc label, used for autocomplete
    command: "gettxoutsetinfo",
    net: "-testnet",
    cli: ["net", "command"]
  },
  listUnspent: {
    rpcCallLabel: "listUnspent", //must be same as rpc label, used for autocomplete
    command: "listunspent",
    net: "-testnet",
    cli: ["net", "command"]
  },
  getTXOut: {
    rpcCallLabel: "getTXOut", //must be same as rpc label, used for autocomplete
    command: "gettxout",
    net: "-testnet",
    cli: ["net", "command"]
  },
  getReceivedByAccount: {
    rpcCallLabel: "getReceivedByAccount", //must be same as rpc label, used for autocomplete
    command: "getreceivedbyaccount",
    net: "-testnet",
    cli: ["net", "command"]
  },
  listAccounts: {
    rpcCallLabel: "listAccounts", //must be same as rpc label, used for autocomplete
    command: "listaccounts",
    net: "-testnet",
    cli: ["net", "command"]
  }
}

function getURLfromNodeCallLabel(theNodeCallLabel, additionalArguments){
  var theRequest = {};
  theRequest[nodeCallLabel] = theNodeCallLabel;
  if (typeof additionalArguments === "object") {
    for (var label in additionalArguments) {
      theRequest[label] = additionalArguments[label];
    }
  }
  return `${url.known.node}?command=${encodeURIComponent(JSON.stringify(theRequest))}`;
}

function getURLfromRPCLabel(theRPClabel, theArguments){
  var theRequest = {};
  theRequest[rpcCallLabel] = theRPClabel;
  var theRPCCall = rpcCalls[theRPClabel];
  for (var label in theRPCCall){
    if (typeof theRPCCall[label] === "string"){
      theRequest[label] = theRPCCall[label]
    } 
  }
  if (theArguments === undefined){
    theArguments = {};
  }
  for (var label in theArguments){
    if (typeof theRPCCall[label] !== "string" && theRPCCall[label] !== null){
      continue; // <- label not valid for this RPC call
    }
    if (typeof theArguments[label] === "string"){
      theRequest[label] = theArguments[label];
    } 
  }
  return `${url.known.rpc}?command=${encodeURIComponent(JSON.stringify(theRequest))}`;
}

function getRPCcallArguments(theRPCLabel, additionalArguments, errors){
  var result = [];
  if (!(theRPCLabel in rpcCalls)){
    errors.push(`Uknown or non-implemented rpc command: ${theRPCLabel}.`);
    return null;
  }
  var theRPCCall = rpcCalls[theRPCLabel];
  for (var counterCommand = 0; counterCommand < theRPCCall.cli.length; counterCommand ++){
    var currentLabel = theRPCCall.cli[counterCommand];
    if (!(currentLabel in additionalArguments)){
      if (!(currentLabel in theRPCCall)){
        console.log(`WARNING: no default given for ${currentLabel} in rpc call labeled ${theRPCLabel}. If this is an optional argument, set the default to an empty string.`.red);
        continue;
      }
      if (typeof theRPCCall[currentLabel] === null){
        errors.push(`Mandatory argument ${currentLabel} missing for rpc command: ${theRPCLabel}`);
        return null;
      }
      if (theRPCCall[currentLabel] === ""){
        continue;
      }
      result.push(theRPCCall[currentLabel]);
    } else {
      if (typeof additionalArguments[currentLabel] === "string"){
        if (additionalArguments[currentLabel] !== ""){
          result.push(additionalArguments[currentLabel]);
          //console.log(`Pusing label ${currentLabel} with value: ${additionalArguments[currentLabel]}.`);
        } 
      }
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
  rpcCallLabel,
  nodeCallLabel,
  getURLfromRPCLabel,
  getURLfromNodeCallLabel,
  getRPCcallArguments,
}
