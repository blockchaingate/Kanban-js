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
    kanbanGOTransfer: "pageKanbanGoTransactions",
    sandbox: "pageSandbox",
    fabcoin: {
      initialization: "pageFabcoinInitialization",  
      smartContract: "pageFabcoinSmartContract",
      crypto: "pageFabcoinCrypto",
    },
    myNodes: "pageMyNodes",
    themes: "pageThemes",
    privacyPolicy: "pagePrivacyPolicy",
    login: "pageLogin",
    serverStatus: "pageServerStatus",
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
    inputTransfers: {
      nameInputForHelloWorld: "inputKBGOInputNameForHelloWorld",
      nameInputForSandbox: "inputKBGOInputNameForSandbox",
      nameInputForRIPEMD: "inputKBGOInputNameForRIPEMD"
    },
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
      messageHex: "inputKBGOMessageHex",
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
      contractFunctionName: "inputKBGOSmartContractFunctionName",
      gasLimit: "inputKBGOGasLimit",
      gasPrice: "inputKBGOGasPrice",
      contractFunctionId: "inputKBGOSmartContractFunctionId",
      contractFunctionArguments: "inputKBGOSmartContractFunctionArguments",
      contractId: "inputKBGOContractId",
      contractData: "inputKBGOSmartContractData",
      txAggregatePublicKeys: "inputKBGOAggregateSignaturePubKeysForTx",
      txAggregateSignature: "inputKBGOAggregateSignatureForTx",
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
      chainId: "inputKBGOChainId",
      numberOfNodes: "inputKBGONumberOfGethNodes",
      contractId: "inputKBGOContractId",
      contractABI: "inputKBGOContractABI"
    },
    checkboxes: {
      transactions: {
        // The following labels must match those in the fab page
        noAncestorTransaction: "checkboxKanbanIncludeNoAncestorTransaction",
        contractCallsInOutputs: "checkboxKanbanIncludeContractCalls",
        sendToContract: "checkboxKanbanSendToContract",
        secretSignsPubkeyNoHash: "checkboxKanbanSecretSignsPubkeyNoHash"
        // end of matching 
      },
    },
    checkboxConnectKanbansInALine: "checkboxConnectKanbansInALine",
    checkboxFabcoindAutostartAfterKanbanGO: "checkboxFabcoindAutostartAfterKanbanGO",
    nodePanel: "spanKanbanGoNodeContainer",
    outputKBGOTest: "divOutputKBGOTest",
    outputKanbanInitialization: "divOutputMyLocalKanbanNodes",
    outputSendReceive: "divOutputKBGOSendReceive",
    outputTransfer: "outputKanbanGoTransactions",
    outputTransferForSandbox: "outputKanbanGoTransferForSandbox",
    outputTransferForRIPEMD: "outputKanbanGoTransferForRIPEMD",
  },
  serverStatus: {
    outputServerStatus: "divOutputServerStatus",
  },
  myNodes: {
    outputMyNodes: "divMyNodesOutput",
    inputSSH: {
      machineNames: "inputMyNodeNames",
      command: "inputMyNodesCommand",
    },
    panelMyNodesList: "panelMyNodesList",
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
      //addressEthereum: "inputEthereumAddress",
      addressKanban: "inputKanbanAddress",
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
      shardId: "inputFabcoinSCARShardId",
      gasLimit: "inputFabcoinGasLimit",
      gasPrice: "inputFabcoinGasPrice",
      contractData: "inputFabcoinContractData",
      contractFunctionArguments: "inputFabcoinContractFunctionArguments",
      contractFunctionId: "inputFabcoinContractFunctionId",
      txAggregatePublicKeys: "inputAggregateSignaturePubKeysForTx",
      txAggregateSignature: "inputAggregateSignatureForTx",
      // end of matching 
      solidityInput: "aceEditor",
      contractFunctionName: "inputSolidityFunctionName",
    },
    checkboxes: {
      transactions: {
        // The following labels must match those in the KBGO page
        noAncestorTransaction: "checkboxFabcoinIncludeNoAncestorTransaction",
        contractCallsInOutputs: "checkboxFabcoinIncludeContractCalls",
        sendToContract: "checkboxFabcoinSendToContract",
        secretSignsPubkeyNoHash: "checkboxFabcoinSecretSignsPubkeyNoHash",
        // end of matching.
      },
    },
    inputCrypto: {
      inputSchnorrSignature: {
        publicKey: "inputPublicKeyDefault",
        privateKey: "inputPrivateKeySchnorrDefault",
        messageToSha3: "inputFabcoinSchnorrMessage",
        messageToSha3Hex: "inputFabcoinSchnorrMessageHex",
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
    myNodesList: "myNodesList",
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
