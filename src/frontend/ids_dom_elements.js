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
  inputSendAddress: "inputSendAddress",
  inputAccountName: "inputAccountName",
  inputBlockHash: "inputBlockHash",
  inputBestBlockIndex: "inputBestBlockIndex",
  inputTransactionIdForSending: "inputTransactionIdForSending",
  inputAmountForSending: "inputAmountForSending",
  inputOmniForSending: "inputOmniForSending",
  inputNumberOfTransactions: "inputNumberOfTransactions",
  inputSendRawTransaction: "inputSendRawTransaction",
  inputSendPrivateKey: "inputSendPrivateKey",
  inputTransactionId: "inputTransactionId",
  inputSendIndexValueOut: "inputSendIndexValueOut",
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
  checkboxSyncronizeOmni: "checkboxSyncronizeOmni",
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