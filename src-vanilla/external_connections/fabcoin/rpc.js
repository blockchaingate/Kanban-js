"use strict";

var urlStrings = {
  rpcCallLabel: "rpcCall",
  command: "command"
};

/**
 * @type {Object.<string,{rpcCall:string, method: string, mandatoryFixedArguments: Object, mandatoryModifiableArguments: Object, optionalArguments: Object, types: Object, parameters: string[]}>}
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
    types: { // <- indicates expected type for a given input.
      blockNumber: "number"
    },
    parameters: ["blockNumber"] // <- parameters passed to the method, in the given order
  },
  getBlockCount: {
    rpcCall: "getBlockCount",
    method: "getblockcount",
    parameters: []
  },
  getBestBlockHash: {
    rpcCall: "getBestBlockHash",
    method: "getbestblockhash",
    parameters: []
  },
  getBlockByHash: {
    rpcCall: "getBlockByHash",
    method: "getblock",  
    mandatoryFixedArguments: {
    },
    mandatoryModifiableArguments: {
      hash: null
    },
    parameters: ["hash"]
  },
  generateBlocks: {
    rpcCall: "generateBlocks", 
    method: "generate",  
    mandatoryFixedArguments: {
    },
    mandatoryModifiableArguments: {
      numberOfBlocks: null
    },
    types: {
      numberOfBlocks: "number"
    },
    parameters: ["numberOfBlocks"]
  },
  getWalletTransactionById: {
    rpcCall: "getWalletTransactionById",
    method: "gettransaction",
    mandatoryModifiableArguments: {
      txid: null,
      includeWatchOnly: false,
    },
    parameters: ["txid", "includeWatchOnly"]    
  },
  getTransactionById: {
    rpcCall: "getTransactionById",
    method: "getrawtransaction",
    mandatoryModifiableArguments: {
      txid: null,
      verbose: true
    },
    parameters: ["txid", "verbose"]    
  },
  decodeTransactionRaw: {
    rpcCall: "decodeTransactionRaw",
    method: "decoderawtransaction",
    mandatoryModifiableArguments: {
      hexString: null
    },
    parameters: ["hexString"]
  },
  listContracts: {
    rpcCall: "listContract",
    method: "listcontracts",
    mandatoryModifiableArguments:{
      start: 1,
      maxDisplay: 1000
    },
    parameters: ["start", "maxDisplay"]
  },
  getNewAddress: {
    rpcCall: "getNewAddress",
    method: "getnewaddress",
    optionalArguments: {
      name: null
    },
    parameters: ["name"]
  },
  dumpPrivateKey: {
    rpcCall: "dumpPrivateKey",
    method: "dumpprivkey",
    mandatoryModifiableArguments: {
      address: null
    },
    parameters: ["address"]
  },
  createRawTransaction: {
    rpcCall: "createRawTransaction",
    method: "createrawtransaction",
    mandatoryModifiableArguments: {
      inputs: null,
      outputs: null
    },
    parameters: ["inputs", "outputs"]
  },
  signRawTransaction: {
    rpcCall: "signRawTransaction",
    method: "signrawtransaction",
    mandatoryFixedArguments: {
      parents: [],
    },
    optionalArguments: {
      privateKeys: null
    },
    mandatoryModifiableArguments: {
      hexString: null,
    },
    parameters: ["hexString", "parents", "privateKeys"]
  },
  insertAggregateSignature: {
    rpcCall: "insertAggregateSignature",
    method: "insertaggregatesignature",
    mandatoryModifiableArguments: {
      rawTransaction: null,
      aggregateSignature: null,
    },
    parameters: ["rawTransaction", "aggregateSignature"]
  },
  sendRawTransaction: {
    rpcCall: "sendRawTransaction",
    method: "sendrawtransaction",
    mandatoryModifiableArguments: {
      rawTransactionHex: null
    },
    parameters: ["rawTransactionHex"]
  },
  getRawMempool: {
    rpcCall: "getRawMempool",
    method: "getrawmempool",
    mandatoryFixedArguments: {
      verbose: null
    },
    parameters: ["verbose"]
  },
  createContract: {
    rpcCall: "createContract",
    method: "createcontract",
    mandatoryModifiableArguments: {
      contractHex: null
    },
    parameters: ["contractHex"]
  },
  sendToContract: {
    rpcCall: "sendToContract",
    method: "sendtocontract",
    mandatoryModifiableArguments: {
      contractId: null,
      data: null,
      amount: 0,
    },
    parameters: ["contractId", "data", "amount"]
  },
  callContract: {
    rpcCall: "callContract",
    method: "callcontract",
    mandatoryModifiableArguments: {
      contractId: null,
      data: null,
    },
    parameters: ["contractId", "data"]
  },
  testSha3: {
    rpcCall: "testSha3",
    method: "testshathree",
    mandatoryModifiableArguments: {
      message: null
    },
    types: {
      message: "base64"
    },
    parameters: ["message"]
  },
  testPrivateKeyGeneration: {
    rpcCall: "testPrivateKeyGeneration",
    method: "testprivatekeygeneration",
    parameters: []
  },
  testPublicKeyFromPrivate: {
    rpcCall: "testPublicKeyFromPrivate",
    method: "testpublickeyfromprivate",
    mandatoryModifiableArguments: {
      privateKey: null,
    },
    parameters: ["privateKey"]
  },
  testAggregateSignatureGeneratePrivateKeys: {
    rpcCall: "testAggregateSignatureGeneratePrivateKeys", 
    method: "testaggregatesignaturegenerateprivatekeys",
    mandatoryModifiableArguments: {
      numberOfPrivateKeysToGenerate: null,
    },
    parameters: ["numberOfPrivateKeysToGenerate"]
  },
  testAggregateSignatureInitialize: {
    rpcCall: "testAggregateSignatureInitialize", 
    method: "testaggregatesignatureinitialize",
    mandatoryModifiableArguments: {
      privateKeys: null,
    },
    parameters: ["privateKeys"]
  },
  testAggregateSignatureCommitment: {
    rpcCall: "testAggregateSignatureCommitment",
    method: "testaggregatesignaturecommit",
    mandatoryModifiableArguments: {
      messageHex: null
    },
    optionalArguments: {
      nonces: null
    },
    parameters: ["messageHex", "nonces"]
  },
  testAggregateSignatureChallenge: {
    rpcCall: "testAggregateSignatureChallenge",
    method: "testaggregatesignaturechallenge",
    mandatoryModifiableArguments: {
      committedSignersBitmap: null,
      commitments: null,
    },
    parameters: ["committedSignersBitmap", "commitments"]
  },
  testAggregateSignatureSolutions: {
    rpcCall: "testAggregateSignatureSolutions",
    method: "testaggregatesignaturesolutions",
    mandatoryModifiableArguments: {
      committedSignersBitmap: null,
      messageDigest: null,
      aggregateCommitment: null, 
      aggregatePublicKey: null
    },
    parameters: ["committedSignersBitmap", "messageDigest", "aggregateCommitment", "aggregatePublicKey"]
  },
  testAggregateSignatureAggregation: {
    rpcCall: "testAggregateSignatureAggregation",
    method: "testaggregatesignatureaggregation",
    mandatoryModifiableArguments: {
      solutions: null
    },
    parameters: ["solutions"]
  },
  testAggregateVerification: {
    rpcCall: "testAggregateVerification",
    method: "testaggregatesignatureverification",
    mandatoryModifiableArguments: {
      signature: null,
      committedSignersBitmap: null,
      publicKeys: null,
      messageHex: null
    },
    parameters: ["signature", "committedSignersBitmap", "publicKeys", "messageHex"]
  },
  testAggregateVerificationComplete: {
    rpcCall: "testAggregateVerificationComplete",
    method: "testaggregateverificationcomplete",
    mandatoryModifiableArguments: {
      signatureComplete: null,
      messageHex: null
    },
    parameters: ["signatureComplete", "messageHex"]
  },
  testSchnorrSignature: {
    rpcCall: "testSchnorrSignature",
    method: "testschnorrsignature",
    mandatoryModifiableArguments: {
      privateKey: null,
      message: null,
    },
    optionalArguments: {
      nonce: null
    },
    parameters: ["privateKey", "message", "nonce"]
  },
  testSchnorrSignatureVerify: {
    rpcCall: "testSchnorrSignatureVerify", 
    method: "testschnorrverification",
    mandatoryModifiableArguments: {
      signature: null,
      publicKey: null,
      message: null
    },
    parameters: ["signature", "publicKey", "message"]
  },
  showLogFile: {
    rpcCall: "showLogFile",
    method: "getlogfile",
    mandatoryModifiableArguments: {
      logFile: null,
    },
    parameters: ["logFile"],
  },
};

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