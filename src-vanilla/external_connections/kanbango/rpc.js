"use strict";

var urlStrings = {
  serviceLabelReserved: "serviceLabelReserved",
  callType: "callType",
  nodeId: "nodeId",
  rpcCallLabel: "rpcCall",
  errorKanbanNodeStartWasNeverAttempted: "KanbanGo start was never attempted. ",
};

/**
 * @type {Object.<string,{rpcCall:string, method: string, mandatoryFixedArguments: Object, mandatoryModifiableArguments: Object, optionalArguments: Object, types: Object, parameters: string[]}>}
 */
var rpcCalls = {
  //The method names of the ethereum calls are composed like this:
  //1. Take the function name, say, TestSha3. 
  //2. Lowercase the first letter, say, testSha3.
  //3. Prefix the name with the module name, say, cryptotest_testSha3.
  testSha3: {
    rpcCall: "testSha3", //must be same as rpc label, used for autocomplete
    method: "cryptotest_testSha3", //<- name of go's RPC method 
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      messageHex: null,
    },
    parameters: ["messageHex"]
  },
  testSha2: {
    rpcCall: "testSha2", //must be same as rpc label, used for autocomplete
    method: "cryptotest_testSha2", //<- name of go's RPC method 
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      messageHex: null,
    },
    parameters: ["messageHex"]
  },
  testSha2Squared: {
    rpcCall: "testSha2Squared", //must be same as rpc label, used for autocomplete
    method: "cryptotest_testSha2Squared", //<- name of go's RPC method 
    mandatoryModifiableArguments: { //<- values give defaults, null for none
      messageHex: null,
    },
    parameters: ["messageHex"]
  },
  testPrivateKeyGeneration: {
    rpcCall: "testPrivateKeyGeneration",
    method: "cryptotest_testPrivateKeyGeneration",
    parameters: []
  },
  testPublicKeyFromPrivate: {
    rpcCall: "testPublicKeyFromPrivate",
    method: "cryptotest_testPublicKeyFromPrivate", 
    mandatoryModifiableArguments: {
      privateKey: null,
    },
    parameters: ["privateKey"]
  },
  testECDSASignature: {
    rpcCall: "testECDSASignature",
    method: "cryptotest_testECDSASignature",
    mandatoryModifiableArguments: {
      privateKey: null,
      messageHex: null,
    },
    parameters: ["privateKey", "messageHex"]
  },
  testECDSAVerification: {
    rpcCall: "testECDSAVerification",
    method: "cryptotest_testECDSAVerification",
    mandatoryModifiableArguments: {
      signatureHex: null,
      publicKey: null,
      messageHex: null,
    },
    parameters: ["signature", "publicKey", "messageHex"]
  },
  testSchnorrSignature: {
    rpcCall: "testSchnorrSignature", 
    method: "cryptotest_testSchnorrSignature",
    mandatoryModifiableArguments: {
      privateKey: null,
      messageHex: null,
    },
    parameters: ["privateKey", "messageHex"]
  },
  testSchnorrVerification: {
    rpcCall: "testSchnorrVerification",
    method: "cryptotest_testSchnorrVerification",
    mandatoryModifiableArguments: {
      signature: null,
      publicKey: null,
      messageHex: null,
    },
    parameters: ["signature", "publicKey", "messageHex"]
  },
  testAggregateGeneratePrivateKeys: {
    rpcCall: "testAggregateGeneratePrivateKeys", 
    method: "cryptotest_testAggregatePrivateKeyGeneration",
    mandatoryModifiableArguments: {
      numberOfPrivateKeysToGenerate: null,
    },
    parameters: ["numberOfPrivateKeysToGenerate"]
  },
  testAggregateInitialize: {
    rpcCall: "testAggregateInitialize", 
    method: "cryptotest_testAggregateInitialize",
    mandatoryModifiableArguments: {
      privateKeys: null,
    },
    parameters: ["privateKeys"]
  },
  testAggregateCommitment: {
    rpcCall: "testAggregateCommitment",
    method: "cryptotest_testAggregateCommitment",
    mandatoryModifiableArguments: {
      messageBase64: null
    },
    parameters: ["messageBase64"]    
  },
  testAggregateChallenge: {
    rpcCall: "testAggregateChallenge",
    method: "cryptotest_testAggregateChallenge",
    mandatoryModifiableArguments: {
      commitmentsBase64: null,
      committedSigners: null
    },
    parameters: ["commitmentsBase64", "committedSigners"]    
  },
  testAggregateSolutions: {
    rpcCall: "testAggregateSolutions",
    method: "cryptotest_testAggregateSolutions",
    mandatoryModifiableArguments: {
      committedSigners: null,
      digest: null,
      aggregateCommitment: null,
      aggregatePublicKey: null,
    },
    parameters: ["committedSigners", "digest", "aggregateCommitment", "aggregatePublicKey"]    
  },
  testAggregateSignature: {
    rpcCall: "testAggregateSignature",
    method: "cryptotest_testAggregateSignature",
    mandatoryModifiableArguments: {
      committedSigners: null,
      solutionsBase64: null,
    },
    parameters: ["committedSigners", "solutionsBase64"]    
  },
  testAggregateVerification: {
    rpcCall: "testAggregateVerification",
    method: "cryptotest_testAggregateVerification",
    mandatoryModifiableArguments: {
      signature: null,
      committedSigners: null,
      allPublicKeysBase64: null,
      messageBase64: null,
    },
    parameters: ["signature", "committedSigners", "allPublicKeysBase64", "messageBase64"]    
  },
  testAggregateVerificationComplete: {
    rpcCall: "testAggregateVerificationComplete",
    method: "cryptotest_testAggregateVerificationComplete",
    mandatoryModifiableArguments: {
      signatureComplete: null,
      messageBase64: null
    },
    parameters: ["signatureComplete", "messageBase64"]
  },
  getBestBlockNumber: {
    rpcCall: "getBestBlockNumber",
    method: "kanban_blockNumber",
    parameters: [],
  },
  getBlockByNumber: {
    rpcCall: "getBlockByNumber",
    method: "kanban_getBlockByNumber",
    optionalArguments: {
      blockNumber: null,
    },
    mandatoryModifiableArguments: {
      verbose: true,
    },
    types: {
      blockNumber: "numberHex"
    },
    parameters: ["blockNumber", "verbose"]
  },
  getBlockByHash: {
    rpcCall: "getBlockByHash",
    method: "kanban_getBlockByHash",
    mandatoryFixedArguments: {
      verbose: true
    },
    mandatoryModifiableArguments: {
      blockHash: null
    },
    parameters: ["blockHash", "verbose"]
  },
  round: {
    rpcCall: "round",
    method: "pbft_round",
    parameters: []
  },
  currentProposal: {
    rpcCall: "currentProposal",
    method: "pbft_currentProposal",
    parameters: []
  },
  peerView: {
    rpcCall: "peerView",
    method: "pbft_peerView", //<- method name passed to kanban-go
    parameters: []
  },
  roundChangeRequests: {
    rpcCall: "roundChangeRequests",
    method: "pbft_roundChangeRequests", //<- method name passed to kanban-go
    parameters: []
  },
  getAccountsStates: {
    rpcCall: "getAccountsStates",
    method: "bridge_getAccountsStates", //<- method name passed to kanban-go
    parameters: []
  },
  getMainChainAccountsBalance: {
    rpcCall: "getMainChainAccountsBalance",
    method: "bridge_getMainChainAccountsBalance", //<- method name passed to kanban-go
    parameters: []
  },
  validators: {
    rpcCall: "validators",
    method: "pbft_validators",
    parameters: []
  },
  versionGO: {
    rpcCall: "versionGO",
    method: "web3_clientVersion",
    parameters: []
  },
  chainId: {
    rpcCall: "chainId",
    method: "net_version",
    parameters: []
  },
  votingMachineStats: {
    rpcCall: "votingMachineStats",
    method: "pbfttest_votingMachineStats",
    parameters: [],
  },
  voteMessageAndWriteToHeader: {
    rpcCall: "voteMessageAndWriteToHeader",
    method: "pbft_voteMessageAndWriteToHeader",
    mandatoryModifiableArguments: {
      messageHex: null
    },
    parameters: ["messageHex"],
  },
  generateWriteBack: {
    rpcCall: "generateWriteBack",
    method: "pbft_generateWriteBack",
    mandatoryModifiableArguments: {
      messageHex: null,
    },
    parameters: ["messageHex"],
  },
  writeMessageToBlockHeader: {
    rpcCall: "writeMessageToBlockHeader",
    method: "pbft_writeMessageToBlockHeader",
    mandatoryModifiableArguments: {
      messageHex: null
    },
    parameters: ["messageHex"],
  },
  votingNetStats: {
    rpcCall: "votingNetStats",
    method: "net_voteMessageNetworkStats",
    parameters: [],
  },
  voteMessage: {
    rpcCall: "voteMessage",
    method: "pbfttest_testVote",
    mandatoryModifiableArguments: {
      messageHex: null,
    },
    parameters: ["messageHex"],
  },
  rpcModules: {
    rpcCall: "rpcModules",
    method: "rpc_modules",
    parameters: [],
  },
  bridgeStatus: {
    rpcCall: "bridgeStatus",
    method: "bridge_bridgeStatus",
    parameters: [],
  },
  sendBenchmarkTransactions: {
    rpcCall: "sendBenchmarkTransactions",
    method: "kanban_sendBenchmarkTransactions",
    mandatoryModifiableArguments: {
      privateKey: null,
      toAddress: null,
      transactionNumber: null,
      transactionValue: null,
    },
    parameters: ["privateKey", "toAddress", "transactionNumber", "transactionValue"],
  },
  testCreateAndSignTransactionStandard: {
    rpcCall: "testCreateAndSignTransactionStandard",
    method: "pbfttest_testCreateAndSignTransactionStandard",
    mandatoryModifiableArguments: {
      inputs: null,
      outputs: null,
    },
    parameters: ["inputs", "outputs"],
  },
  decodeFabcoinTransactionHex: {
    rpcCall: "decodeFabcoinTransactionHex",
    method: "pbfttest_decodeFabcoinTransactionHex",
    mandatoryModifiableArguments: {
      transactionHex: null,
    },
    parameters: ["transactionHex"],
  },
  getExternalTransaction: {
    rpcCall: "getExternalTransaction",
    method: "bridge_getExternalTransaction",
    mandatoryModifiableArguments: {
      txid: null,
    },
    parameters: ["txid"],
  }
};

module.exports = {
  urlStrings,
  rpcCalls,
}