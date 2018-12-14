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
      messageHex: "inputKBGOSchnorrMessageHex",
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
      // The following labels must match those in the fab page
      secretIn: "inputKBGOSecretIn",
      txHex: "inputKBGOTransactionHex",
      txInIds: "inputKBGOTransactionInId",
      txInNOuts: "inputKBGOTransactionInNOut",
      txBeneficiaryAddresses: "inputKBGOTransactionBeneficiaryAddress",
      txBeneficiaryAmounts: "inputKBGOTransactionBeneficiaryAmount",
      txFee: "inputKBGOTransactionFees",
      txInputs: "inputKBGOTransactionInputs",
      txOutputs: "inputKBGOTransactionOutputs",
      contractId: "inputKBGOSmartContractId",
      contractFunctionName: "inputKBGOSmartContractFunctionName",
      gasLimit: "inputKBGOGasLimit",
      gasPrice: "inputKBGOGasPrice",
      contractFunctionId: "inputKBGOSmartContractFunctionId",
      contractFunctionArguments: "inputKBGOSmartContractFunctionArguments",
      contractData: "inputKBGOSmartContractData",
      // end of matching 
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
    checkboxes: {
      transactions: {
        contractCallsInInputs: "checkboxKanbanIncludeContract_CallsInInputs",
        contractCallsInOutputs: "checkboxKanbanIncludeContractCalls",
        sendToContract: "checkboxKanbanSendToContract",
        secretSignsPubkeyNoHash: "checkboxKanbanSecretSignsPubkeyNoHash"
      },
    },
    checkboxConnectKanbansInALine: "checkboxConnectKanbansInALine",
    checkboxFabcoindAutostartAfterKanbanGO: "checkboxFabcoindAutostartAfterKanbanGO",
    nodePanel: "spanKanbanGoNodeContainer",
    outputKBGOTest: "divOutputKBGOTest",
    outputKanbanInitialization: "divOutputMyLocalKanbanNodes",
    outputSendReceive: "divOutputKBGOSendReceive",
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
      // The following labels must match those in the kanbabGO page
      txHex: "inputFabcoinTransactionHex",
      secretIn: "inputFabcoinSecretIn",
      txInIds: "inputFabcoinTxInIds",
      txInNOuts: "inputFabcoinTxInNOuts",
      txBeneficiaryAddresses: "inputFabcoinBeneficiaryAddresses",
      txBeneficiaryAmounts: "inputFabcoinBeneficiaryAmounts",
      txFee: "inputFabcoinFee",
      txInputs: "inputFabcoinTransactionInputs",
      txOutputs: "inputFabcoinTransactionOutputs",
      contractHex: "inputFabcoinContractHex",
      contractId: "inputFabcoinContractId",
      gasLimit: "inputFabcoinGasLimit",
      gasPrice: "inputFabcoinGasPrice",
      contractData: "inputFabcoinContractData",
      contractFunctionArguments: "inputFabcoinContractFunctionArguments",
      contractFunctionId: "inputFabcoinContractFunctionId",
      // end of matching 
      txAggregatePublicKeys: "inputAggregateSignaturePubKeysForTx",
      txAggregateSignature: "inputAggregateSignatureForTx",
      solidityInput: "aceEditor",
      contractFunctionName: "inputSolidityFunctionName",
    },
    checkboxes: {
      transactions: {
        contractCallsInInputs: "checkboxFabcoinIncludeContract_CallsInInputs",
        contractCallsInOutputs: "checkboxFabcoinIncludeContractCalls",
        sendToContract: "checkboxFabcoinSendToContract",
        secretSignsPubkeyNoHash: "checkboxFabcoinSecretSignsPubkeyNoHash",
      },
    },
    inputCrypto: {
      inputSchnorrSignature: {
        publicKey: "inputPublicKeyDefault",
        privateKey: "inputPrivateKeySchnorrDefault",
        messageToSha3: "inputFabcoinSchnorrMessage",
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
