"use strict";

var ports = { 
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
  kanbanProofOfConcept: `${__dirname}/../kanban-poc`,
  kanbanProofOfConceptSRC: `${__dirname}/../kanban-poc/src`,
  openCLDriverBuildPath: `${__dirname}/../build`,
  fabcoinConfigurationFolder: null,
  kanbanProofOfConcentConfigurationFolder: null
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
  kanbanCli: `${path.kanbanProofOfConceptSRC}/fabcoin-cli`,
  kanband: `${path.kanbanProofOfConceptSRC}/fabcoind`,
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
    kanbanRPC: "/kanbanRPC",
    computationEngine: "/computation_engine",
    fabcoinInitialization: "/fabcoin_initialization",
    myNodesCommand: "/my_nodes",
    logFileTestNetNoDNS: "/logFileTestNetNoDNS",
    logFileTestNetNoDNSSession: "/logFileTestNetNoDNSSession",
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

var networkDataKanban = {
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

var forceRPCPOST = "forceRPCPOST";
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

var allowedArgumentValuesKanbanDefaults = {
  net: [
    networkDataKanban.testKanban.rpcOption, 
    networkData.mainNet.rpcOption
  ]
}

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
        networkDataKanban.testKanban.rpcOption
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
        networkDataKanban.testKanban.rpcOption
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
        networkDataKanban.testKanban.rpcOption
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
        networkDataKanban.testKanban.rpcOption
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
      commitments: null
    },
    allowedArgumentValues: {
      net: [ //<- restricted network access!
        networkDataKanban.testKanban.rpcOption
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
      challenge: null,
      aggregatedCommitment: null, 
      aggregatedPublicKey: null
    },
    allowedArgumentValues: {
      net: [ //<- restricted network access!
        networkDataKanban.testKanban.rpcOption
      ]
    },
    address: "",
    cli: ["net", "command", "committedSignersBitmap", "challenge", "aggregatedCommitment", "aggregatedPublicKey"]
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
        networkDataKanban.testKanban.rpcOption
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
        networkDataKanban.testKanban.rpcOption
      ]
    },
    address: "",
    cli: ["net", "command", "signature", "committedSignersBitmap", "publicKeys", "message"]
  },
  testSha3: {
    rpcCall: "testSha3", //must be same as rpc label, used for autocomplete
    mandatoryFixedArguments: { //<- values give defaults, null for none
      command: "testshathree",
    },
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      message: null
    },
    allowedArgumentValues: {
      net: [ //<- restricted network access!
        networkDataKanban.testKanban.rpcOption
      ]
    },
    address: "",
    cli: ["net", "command", "message"]
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
        networkDataKanban.testKanban.rpcOption
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
        networkDataKanban.testKanban.rpcOption
      ]
    },
    address: "",
    cli: ["net", "command", "signature", "publicKey", "message"]
  },
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
}

var rpcCallsBannedUnlessSecurityRelaxed = {};
rpcCallsBannedUnlessSecurityRelaxed[rpcCalls.dumpPrivateKey.command] = true;

var fabcoinInitialization = "fabcoinInitialization";

var pathsComputedAtRunTime = {
  fabcoinConfigurationFolder: null,
  kanbanProofOfConcentConfigurationFolder: null
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
  startKanban: {
    fabcoinInitialization: "startKanban", //must be same as label, used for autocomplete
    command: pathname.kanband,
    allowedArgumentValues: {
      net: [networkDataKanban.testKanban.rpcOption, networkDataKanban.mainKanban.rpcOption],
    },
    cli: [ 
      ["dataDir", null], //<- please keep this option first, it is referred to in initialize_fabcoin_folders
      ["net", networkRPCOption.testNetNoDNS], 
      "-gen", 
      "-printtoconsole", 
      "-logips", 
      "-daemon"      
    ] //when the argument is an array, the second is the default
  },
  killAll: {
    fabcoinInitialization: "killAll",
    command: "killall",
    cli: ["fabcoind"]
  },
  killAllKanbans: {
    fabcoinInitialization: "killAllKanbans",
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
  gitPullKanban: {
    fabcoinInitialization: "gitPullKanban",
    command: "git",
    path: path.kanbanProofOfConcept,
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
      machineName: null,
      net: null
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
  },
  sshNodeToOneRemoteMachineGitPullMakeFab: {
    myNodesCommand: "sshNodeToOneRemoteMachineGitPullMakeFab",
    cli: {
      machineName: null
    }    
  },
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
  var entryPoint = url.known.rpc;
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
}

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

function isAllowedArgumentForFabInitialization(theInitCall, theLabel, theValue, errors, callCollection) {
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
    `Variable <b>${theLabel}</b> not allowed to take on value <b>${theValue}</b> in command <b>${theInitCall.fabcoinInitialization}</b>.
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
  networkDataKanban,
  hasRelaxedNetworkSecurity,
  ///////////////
  //information on the various calls:
  rpcCallsKanban,
  rpcCalls,
  rpcCallsBannedUnlessSecurityRelaxed,
  computationalEngineCalls,
  fabcoinInitializationProcedures,
  myNodesCommands,
  ///////////////
  //label for the various type of commands:
  forceRPCPOST,
  rpcCall,
  computationalEngineCall,
  fabcoinInitialization,
  myNodesCommand,
  ///////////////
  getRPCJSON,
  getNetworkDataFromRPCNetworkOption,
  getURLfromRPCLabel,
  getPOSTBodyfromRPCLabel,
  getURLfromComputationalEngineCall,
  getURLFromMyNodesCall,
  getURLFromFabcoinInitialization,
  getRPCcallArguments,
  getRPCNet,
  getFabcoinInitializationCallArguments,
  gpuCommands,
}
