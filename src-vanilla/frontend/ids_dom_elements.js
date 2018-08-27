"use strict";

var defaults = {
  pageBlockInfo: "pageRPCBlockInfo",
  pageTXInfo: "pageTXInfo",
  pageNetwork: "pageNetwork",
  pageTestGPU: "pageTestGPU",
  pageMyNodes: "pageMyNodes",
  pageSend: "pageSend",
  pageMine: "pageMine",
  pageProfiling: "pageProfiling",
  pageFabcoinInitialization: "pageFabcoinInitialization",
  pageKanbanPlusPlus: "pageKanbanPlusPlus",
  pageKanbanGO: "pageKanbanGO",
  progressReport: "spanProgressReport",
  spanPingColumnHeader: "spanPingColumnHeader",
  kanbanGO: {
    inputSchnorr: {
      message: "inputKBGOSchnorrMessage",
      privateKey: "inputKBGOSchnorrPrivateKey",
      nonce: "inputKBGOSchnorrNonce",
      publicKey: "inputKBGOSchnorrPublicKey",
      signature: "inputKBGOSchnorrSignature",
      sha3digest: "inputKBGOSchnorrSha3Digest"
    },
    inputAggregateSignature: {
      message: "inputKBGOMessage",
      numberOfPrivateKeysToGenerate: "inputKBGONumberOfPrivateKeysToGenerate",
      privateKeys: "inputKBGOPrivateKeys",
      nonces: "inputKBGONonces",
      publicKeys: "inputKBGOPublicKeys",
      committedSignersBitmap: "inputKBGOCommittedSignersBitmap",
      commitments: "inputKBGOCommitments",
      challenge: "inputKBGOChallenge",
      aggregatePublickey: "inputKBGOAggregatePublicKey",
      aggregateCommitment: "inputKBGOAggregateCommitment",
      solutions: "inputKBGOSolutions",
      aggregateSignature: "inputKBGOAggregateSignature",
    },
    outputAggregate: "divOutputKBGOAggregate",
    outputSchnorr: "divOutputKBGOSchnorr"
  },
  kanbanPlusPlus: {
    inputSchnorrSignature: {
      publicKey: "inputPublicKeyDefault",
      privateKey: "inputPrivateKeySchnorrDefault",
      messageToSha3: "inputMessageToSha3",
      outputSha3DigestDefault: "inputOutputSha3DigestDefault",
      nonce: "inputNoncesDefault",
      signature: "inputSignatureDefault",
    },
    inputAggregateSignature: {
      message: "inputAggregateSignatureMessage",
      commitments: "inputAggregateSignatureCommitments",
      numberOfPrivateKeysToGenerate: "inputAggregateSignatureNumberOfPrivateKeysToGenerate",
      privateKeys: "inputAggregateSignaturePrivateKeys",
      publicKeys: "inputAggregateSignaturePublicKeys",
      committedSignersBitmap: "inputAggregateSignatureCommittedSignersBitmap",
      challenge: "inputAggregateSignatureChallenge",
      aggregatePubkey: "inputAggregateSignatureAggregatePubkey",    
      aggregateCommitment: "inputAggregateSignatureAggregateCommitment",
      solutions: "inputAggregateSignaturesSolutions",
      nonces: "inputAggregateSignatureNonces",
      theAggregation: "inputAggregateSignaturesTheAggregation",
    },
    inputAddressDefault: "inputAddressDefault",
    outputKanbanPlusPlusGeneral: "divKanbanPlusPlusOutput",
    outputKanbanPlusPlusSecond: "divKanbanPlusPlusOutputSecond",
    divKanbanPlusPlusOutputThird: "divKanbanPlusPlusOutputThird"
  },
  inputNumberOfBlocks: "inputNumberOfBlocks",
  inputMaxNumberOfTries: "inputMaxNumberOfTries",
  inputMiningAddress: "inputMiningAddress",
  inputSendAddress: "inputSendAddress",
  inputAccountName: "inputAccountName",
  inputBlockHash: "inputBlockHash",
  inputBestBlockIndex: "inputBestBlockIndex",
  inputSendTransactionId: "inputSendTransactionId",
  inputSendFee: "inputSendFee",
  inputSendOmni: "inputSendOmni",
  inputSendInputRawTransaction: "inputSendInputRawTransaction",
  inputSendRawNonBulkTransaction: "inputSendRawNonBulkTransaction",
  inputSendRawBulkTransaction: "inputSendRawBulkTransaction",

  inputSendAmount: "inputSendAmount",
  inputNumberOfTransactions: "inputNumberOfTransactions",
  inputSendPrivateKey: "inputSendPrivateKey",
  inputSendIndexValueOut: "inputSendIndexValueOut",
  inputComputationalEngineCallTestMessage: "inputComputationalEngineCallTestMessage",
  inputComputationalEngineCallTestNonce: "inputComputationalEngineCallTestNonce",
  inputComputationalEngineCallTestSecretKey: "inputComputationalEngineCallTestSecretKey",
  outputTransactionsButtons: "divTransactionsOutputButtons",
  outputRPCNetwork: "divKanbanRPCOutputNetwork",
  outputGPUTest: "divGPUTestOutput",
  outputMyNodes: "divMyNodesOutput",
  outputSendReceiveRadio: "divSendReceiveOutputRadio",
  outputSendReceiveButtons: "divSendReceiveOutputButtons",
  outputSendReceiveBulkOutputButtons: "divSendReceiveBulkOutputButtons",
  outputMineRadio: "divMineRadioOutput",
  outputMineButtons: "divMineButtonsOutput",
  outputFabcoinInitialization: "divFabcoinInitialization",
  outputProfiling: "divOutputProfiling",
  radioGroups: {
    rpcCallNetwork: "rpcCallNetwork",
    rpcProfiling: "rpcProfiling",
    rpcMine: "rpcMine",
    rpcSend: "rpcSend",
    kanbanPlusPlusGeneral: "kanbanPlusPlusGeneral" 
  },
  radioButtonsSend: {
    bestBlock: "radioBestBlockHash",
    blockInfo: "radioButtonBlockInfo"
  },
  checkboxBlockVerbose: "checkboxBlockVerbose",
  checkboxSyncronizeOmni: "checkboxSyncronizeOmni",
  checkboxForcePOST: "checkboxForcePOST",
  radioButtonsNetwork: {
    regtest: "radioBoxSetRegtest",
    testNetNoDNS: "radioBoxSetTestnetNoDNS",
    testNet: "radioBoxSetTestnet",
    mainNet: "radioBoxSetMainnet"
  },
  radioButtonsNetworkKanban: {
    testKanban: "radioBoxSetTestKanban",
    mainKanban: "radioBoxSetMainKanban"
  }

};

module.exports = {
  defaults
}