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
  progressReport: "spanProgressReport",
  spanPingColumnHeader: "spanPingColumnHeader",
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
    rpcSend: "rpcSend"
  },
  radioButtonsSend: {
    bestBlock: "radioBestBlockHash",
    blockInfo: "radioButtonBlockInfo"
  },
  checkboxBlockVerbose: "checkboxBlockVerbose",
  checkboxSyncronizeOmni: "checkboxSyncronizeOmni",
  radioButtonsNetwork: {
    regtest: "radioBoxSetRegtest",
    testNetNoDNS: "radioBoxSetTestnetNoDNS",
    testNet: "radioBoxSetTestnet",
    mainNet: "radioBoxSetMainnet"
  }
};

module.exports = {
  defaults
}