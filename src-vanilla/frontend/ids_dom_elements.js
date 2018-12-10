"use strict";

var defaults = {
  pageBlockInfo: "pageRPCBlockInfo",
  pageTXInfo: "pageTXInfo",
  pageNetwork: "pageNetwork",
  pageTestGPU: "pageTestGPU",
  pageSend: "pageSend",
  pageMine: "pageMine",
  pageProfiling: "pageProfiling",
  pages: {
    demo: "pageDemo",
    kanbanJS: "pageKanbanJS",
    kanbanGO: "pageKanbanGO",
    kanbanMyLocalNodes: "pageMyLocalKanbanNodes",
    kanbanGOSendReceive: "pageKanbanGOSendReceive",
    fabcoin: {
      initialization: "pageFabcoinInitialization",  
      smartContract: "pageFabcoinSmartContract",
      crypto: "pageFabcoinCrypto",
    },
    myNodes: "pageMyNodes",
    themes: "pageThemes",
    privacyPolicy: "pagePrivacyPolicy",
    login: "pageLogin",
  },
  themes: {
    radios: {
      light: "radioThemeLight",
      dark: "radioThemeDark",
    }
  },
  login: {
    spanSignedInStatus: "spanSignedInStatus",
    spanPermissions: "spanPermissions",
    buttonLogin: "buttonLogin",
    divProfilePicture: "divProfilePicture",
    anchorSignOutMenu: "anchorSignOutMenu",
    anchorSignOutPage: "anchorSignOutPage"
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
  demo: {
    inputs: {
      corporationName: "inputDemoCorporationName",
      corporationNameHex: "inputDemoCorporationNameHex",
      corporationPublicKey: "inputDemoCorporationPublicKey",
      corporationRatio: "inputDemoCorporationRatio",
      beneficiary: "inputDemoCorporationBeneficiary",
      corporationSignature: "inputDemoCorporationSignature",
      transactionHash: "inputDemoCorporationTransactionHash",
      transferPointsFrom: "inputDemoTransferPointsFrom",
      transferPointsTo: "inputDemoTransferPointsTo",
      transferPointsAmount: "inputDemoTransferPointsAmount",
      moneySpent: "inputDemoMoneySpent",
      nonce: "inputDemoCorporationNonce"
      
    },
    canvasQR: "canvasQR",
    outputDemo: "divOutputDemo",
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
      secretIn: "inputKBGOSecretIn",
      txHex: "inputKBGOTransactionHex",
      // The following labels must match those in the fab page
      txInIds: "inputKBGOTransactionInId",
      txInNOuts: "inputKBGOTransactionInNOut",
      txBeneficiaryAddresses: "inputKBGOTransactionBeneficiaryAddress",
      txBeneficiaryAmounts: "inputKBGOTransactionBeneficiaryAmount",
      txFee: "inputKBGOTransactionFees",
      txInputs: "inputKBGOTransactionInputs",
      txOutputs: "inputKBGOTransactionOutputs",
      // end of matching 
      contractId: "inputKBGOSmartContractId",
      contractFunctionName: "inputKBGOSmartContractFunctionName",
      contractFunctionId: "inputKBGOSmartContractFunctionId",
      contractFunctionArguments: "inputKBGOSmartContractFunctionArguments",
      contractData: "inputKBGOSmartContractData",
    },
    inputBenchmarkParameters: {
      toAddress: "inputKBGOToAddress",
      privateKey:  "inputKBGOPrivateKey" ,
      transactionNumber:  "inputKBGOTransactionNumber" ,
      transactionValue:  "inputKBGOTransactionValue",
    },
    inputInitialization: {
      bridgeChainnet: "inputKBGOBridgeChainNet",
      numberOfNodes: "inputKBGONumberOfGethNodes",
      contractId: "inputKBGOContractId",
      contractABI: "inputKBGOContractABI"
    },
    checkboxKanbanIncludeContractCalls: "checkboxKanbanIncludeContractCalls",
    checkboxKanbanSendToContract: "checkboxKanbanSendToContract",
    checkboxConnectKanbansInALine: "checkboxConnectKanbansInALine",
    checkboxFabcoindAutostartAfterKanbanGO: "checkboxFabcoindAutostartAfterKanbanGO",
    nodePanel: "spanKanbanGoNodeContainer",
    outputKBGOTest: "divOutputKBGOTest",
    outputKanbanInitialization: "divOutputMyLocalKanbanNodes",
    outputSendReceive: "divOutputKBGOSendReceive",
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
  myNodes: {
    outputMyNodes: "divMyNodesOutput",
    inputSSH: {
      machineNames: "inputMyNodeNames",
      command: "inputMyNodesCommand",
    },

  },
  fabcoin: {
    inputInitialization: {
      fabcoindArguments: "inputFabcoindArguments",
      smartContractId: "inputFabcoindSmartContract",
    },
    inputBlockInfo: {
      blockNumber: "inputFabcoinBlockNumber",
      blockHash: "inputFabcoinBlockHash",
      numberOfBlocksToGenerate: "inputFabcoinNumberOfBlocksToGenerate",
      address: "inputFabcoinAddress",
      addressMainnet: "inputFabcoinAddressMainnet",
      addressEthereum: "inputEthereumAddress",
      publicKey: "inputFabcoinPublicKey",
      privateKey: "inputFabcoinPrivateKey",
      txid: "inputFabcoinTransactionId",
      txHex: "inputFabcoinTransactionHex",

      // The following labels must match those in the kanbabGO page
      txInIds: "inputFabcoinTxInIds",
      txInNOuts: "inputFabcoinTxInNOuts",
      txBeneficiaryAddresses: "inputFabcoinBeneficiaryAddresses",
      txBeneficiaryAmounts: "inputFabcoinBeneficiaryAmounts",
      txFee: "inputFabcoinFee",
      txInputs: "inputFabcoinTransactionInputs",
      txOutputs: "inputFabcoinTransactionOutputs",
      // end of matching 
      txAggregatePublicKeys: "inputAggregateSignaturePubKeysForTx",
      txAggregateSignature: "inputAggregateSignatureForTx",

      contractHex: "inputFabcoinContractHex",
      contractId: "inputFabcoinContractId",
      contractData: "inputFabcoinContractData",
      contractFunctionArguments: "inputFabcoinContractFunctionArguments",
      contractFunctionId: "inputFabcoinContractFunctionId",
      solidityInput: "aceEditor",
      contractFunctionName: "inputSolidityFunctionName",
    },
    checkboxFabcoinIncludeContractCalls: "checkboxFabcoinIncludeContractCalls",
    checkboxFabcoinSendToContract: "checkboxFabcoinSendToContract",
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
