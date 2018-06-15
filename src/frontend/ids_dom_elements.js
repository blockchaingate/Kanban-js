"use strict";

var defaults = {
  pageBlockInfo: "pageRPCBlockInfo",
  pageTXInfo: "pageTXInfo",
  pageNetwork: "pageNetwork",
  pageTestGPU: "pageTestGPU",
  pageMyNodes: "pageMyNodes",
  pageSend: "pageSend",
  pageMine: "pageMine",
  pageFabcoinInitialization: "pageFabcoinInitialization",
  progressReport: "spanProgressReport",
  spanPingColumnHeader: "spanPingColumnHeader",
  inputNumberOfBlocks: "inputNumberOfBlocks",
  inputMaxNumberOfTries: "inputMaxNumberOfTries",
  inputMiningAddress: "inputMiningAddress",
  inputAddressSendReceive: "inputAddressSendReceive",
  inputAccountName: "inputAccountName",
  inputBlockHash: "inputBlockHash",
  inputBestBlockIndex: "inputBestBlockIndex",
  inputNumberOfTransactions: "inputNumberOfTransactions",
  inputTransactionId: "inputTransactionId",
  inputComputationalEngineCallTestMessage: "inputComputationalEngineCallTestMessage",
  inputComputationalEngineCallTestNonce: "inputComputationalEngineCallTestNonce",
  inputComputationalEngineCallTestSecretKey: "inputComputationalEngineCallTestSecretKey",
  outputTransactionsButtons: "divTransactionsOutputButtons",
  outputRPCBlockInfo: "divKanbanRPCOutputBlockInfo",
  outputRPCTXInfo: "divKanbanRPCOutputTXInfo",
  outputRPCNetwork: "divKanbanRPCOutputNetwork",
  outputGPUTest: "divGPUTestOutput",
  outputMyNodes: "divMyNodesOutput",
  outputSendReceiveRadio: "divSendReceiveOutputRadio",
  outputSendReceiveButtons: "divSendReceiveOutputButtons",
  outputMineRadio: "divMineRadioOutput",
  outputMineButtons: "divMineButtonsOutput",
  outputFabcoinInitialization: "divFabcoinInitialization",
  radioButtonBestBlock: "radioBestBlockHash",
  radioButtonBlockInfo: "radioButtonBlockInfo",
  checkboxBlockVerbose: "checkboxBlockVerbose",
  radioBoxesNetwork: {
    regtest: "radioBoxSetRegtest",
    testNetNoDNS: "radioBoxSetTestnetNoDNS",
    testNet: "radioBoxSetTestnet",
    mainNet: "radioBoxSetMainnet"
  }
};

module.exports = {
  defaults
}