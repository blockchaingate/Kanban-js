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
  inputBlockHash: "inputBlockHash",
  inputBestBlockIndex: "inputBestBlockIndex",
  inputComputationalEngineCallTestMessage: "inputComputationalEngineCallTestMessage",
  inputComputationalEngineCallTestNonce: "inputComputationalEngineCallTestNonce",
  inputComputationalEngineCallTestSecretKey: "inputComputationalEngineCallTestSecretKey",
  outputRPCBlockInfo: "divKanbanRPCOutputBlockInfo",
  outputRPCTXInfo: "divKanbanRPCOutputTXInfo",
  outputRPCNetwork: "divKanbanRPCOutputNetwork",
  outputGPUTest: "divGPUTestOutput",
  outputMyNodes: "divMyNodesOutput",
  outputSendReceive: "divSendReceive",
  outputMine: "divMineOutput",
  outputFabcoinInitialization: "divFabcoinInitialization",
  radioButtonBestBlock: "radioBestBlockHash",
  radioButtonBlockInfo: "radioButtonBlockInfo",
  radioButtonTransactionsSetInfo: "radioButtonTransactionsSetInfo",
  radioButtonTransactionsListUnspent: "radioButtonTransactionsListUnspent",
  checkboxBlockVerbose: "checkboxBlockVerbose",
  raioBoxesNetwork: {
    regtest: "radioBoxSetRegtest",
    testnetNoDNS: "radioBoxSetTestnetNoDNS",
    testnet: "radioBoxSetTestnet",
    mainnet: "radioBoxSetMainnet"
  }
};

module.exports = {
  defaults
}