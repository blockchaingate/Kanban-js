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
  pages: {
    kanbanJS: "pageKanbanJS",
    kanbanGO: "pageKanbanGO",
    kanbanMyLocalNodes: "pageMyLocalKanbanNodes",
    kanbanGOSendReceive: "pageKanbanGOSendReceive",
    fabcoin: {
      initialization: "pageFabcoinInitialization",  
      smartContract: "pageFabcoinSmartContract",
      crypto: "pageFabcoinCrypto",
    },
    themes: "pageThemes",
    privacyPolicy: "pagePrivacyPolicy",
  },
  themes: {
    radios: {
      light: "radioThemeLight",
      dark: "radioThemeDark",
    }
  },
  progressReport: "spanProgressReport",
  spanPingColumnHeader: "spanPingColumnHeader",
  kanbanJS: {
    inputSchnorr: {
      message: "inputKBJSMessage",
      privateKey: "inputKBJSPrivateKey",
      publicKey: "inputKBJSPublicKey"
    },
    outputKBJSCrypto: "divOutputKBJSCryptoTest"
  },
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
      digest: "inputKBGODigest",
      aggregatePublickey: "inputKBGOAggregatePublicKey",
      aggregateCommitment: "inputKBGOAggregateCommitment",
      solutions: "inputKBGOSolutions",
      aggregateSignature: "inputKBGOAggregateSignature",
      aggregateSignatureComplete: "inputKBGOAggregateSignatureComplete",
      aggregateSignatureUncompressed: "inputKBGOAggregateSignatureUncompressed",
    },
    inputSendReceive: {
      blockNumber: "inputKBGOBlockNumber",
      blockHash: "inputKBGOBlockHash",
      messageVoteHex: "inputKBGOVoteMessageHex",
      messageVote: "inputKBGOVoteMessage",
    },
    inputInitialization: {
      numberOfNodes: "inputKBGONumberOfGethNodes",
      contractId: "inputKBGOContractId",
      contractABI: "inputKBGOContractABI"
    },
    checkboxFabcoindAutostartAfterKanbanGO: "checkboxFabcoindAutostartAfterKanbanGO",
    nodePanel: "spanKanbanGoNodeContainer",
    outputKBGOTest: "divOutputKBGOTest",
    outputKanbanInitialization: "divOutputMyLocalKanbanNodes",
    outputSendReceive: "divOutputKBGOSendReceive"
  },
  kanbanPlusPlus: {
    inputSchnorrSignature: {
      publicKey: "inputPublicKeyDefault",
      privateKey: "inputPrivateKeySchnorrDefault",
      messageToSha3: "inputMessageToSha3",
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
      messageDigest: "inputAggregateSignatureMessageDigest",
      aggregatePubkey: "inputAggregateSignatureAggregatePubkey",    
      aggregateCommitment: "inputAggregateSignatureAggregateCommitment",
      solutions: "inputAggregateSignaturesSolutions",
      nonces: "inputAggregateSignatureNonces",
      theAggregation: "inputAggregateSignaturesTheAggregation",
      aggregateSignatureComplete: "inputAggregateSignatureComplete",
    },
    inputAddressDefault: "inputAddressDefault",
    outputKanbanPlusPlusGeneral: "divKanbanPlusPlusOutput",
    outputKanbanPlusPlusSecond: "divKanbanPlusPlusOutputSecond",
    divKanbanPlusPlusOutputThird: "divKanbanPlusPlusOutputThird"
  },
  fabcoin: {
    inputInitialization: {
      fabcoindArguments: "inputFabcoindArguments"
    },
    inputBlockInfo: {
      blockNumber: "inputFabcoinBlockNumber",
      blockHash: "inputFabcoinBlockHash",
      numberOfBlocksToGenerate: "inputFabcoinNumberOfBlocksToGenerate",
      txid: "inputFabcoinTransactionId",
      txHex: "inputFabcoinTransactionHex",
      address: "inputFabcoinAddress",
      addressMainnet: "inputFabcoinAddressMainnet",
      addressEthereum: "inputEthereumAddress",
      publicKey: "inputFabcoinPublicKey",
      privateKey: "inputFabcoinPrivateKey",
      txOutputs: "inputFabcoinTransactionOutputs",
      txOutputAddresses: "inputFabcoinTransactionOutputAddresses",
      txInputs: "inputFabcoinTransactionInputs",
      txAggregatePublicKeys: "inputAggregateSignaturePubKeysForTx",
      txAggregateSignature: "inputAggregateSignatureForTx",
      contractHex: "inputFabcoinContractHex",
      contractId: "inputFabcoinContractId",
      contractData: "inputFabcoinContractData",
      contractFunctionData: "inputFabcoinContractFunctionData",
      contractFunctionId: "inputFabcoinContractFunctionId",
      walletAmount: "inputFabcoinWalletAmount",
      solidityInput: "aceEditor",
      contractFunctionName: "inputSolidityFunctionName",
    },
    inputCrypto: {
      inputSchnorrSignature: {
        publicKey: "inputPublicKeyDefault",
        privateKey: "inputPrivateKeySchnorrDefault",
        messageToSha3: "inputMessageToSha3",
        nonce: "inputNoncesDefault",
        signature: "inputSignatureDefault",
      },
      inputAggregateSignature: {
        message: "inputAggregateSignatureMessage",
        messageHex: "inputAggregateSignatureMessageHex",
        commitments: "inputAggregateSignatureCommitments",
        numberOfPrivateKeysToGenerate: "inputAggregateSignatureNumberOfPrivateKeysToGenerate",
        privateKeys: "inputAggregateSignaturePrivateKeys",
        publicKeys: "inputAggregateSignaturePublicKeys",
        committedSignersBitmap: "inputAggregateSignatureCommittedSignersBitmap",
        messageDigest: "inputAggregateSignatureMessageDigest",
        aggregatePubkey: "inputAggregateSignatureAggregatePubkey",    
        aggregateCommitment: "inputAggregateSignatureAggregateCommitment",
        solutions: "inputAggregateSignaturesSolutions",
        nonces: "inputAggregateSignatureNonces",
        theAggregation: "inputAggregateSignaturesTheAggregation",
        aggregateSignatureComplete: "inputAggregateSignatureComplete",
        aggregateSignatureUncompressed: "inputAggregateSignatureUncompressed",
      },  
    },
    outputFabcoinCrypto: "divFabcoinCryptoOutput",
    outputFabcoinInitialization: "divOutputFabcoinInitialization",
    outputFabcoinBlockInfo: "divOutputFabcoinBlockInfo",
    outputSolidityCompilation: "outputSolidityCompilation"
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