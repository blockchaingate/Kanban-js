"use strict";

var defaults = {
  pageBlockInfo: "pageRPCBlockInfo",
  pageTXInfo: "pageTXInfo",
  pageNetwork: "pageNetwork",
  pageTestGPU: "pageTestGPU",
  pageMyNodes: "pageMyNodes",
  pageFabcoinInitialization: "pageFabcoinInitialization",
  progressReport: "spanProgressReport",
  spanPingColumnHeader: "spanPingColumnHeader",
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
  outputFabcoinInitialization: "divFabcoinInitialization",
  radioButtonBestBlock: "radioBestBlockHash",
  radioButtonBlockInfo: "radioButtonBlockInfo",
  radioButtonTransactionsSetInfo: "radioButtonTransactionsSetInfo",
  radioButtonTransactionsListUnspent: "radioButtonTransactionsListUnspent",
  checkboxBlockVerbose: "checkboxBlockVerbose",
  raioBoxesNetwork: {
    mainnet: "radioBoxSetMainnet",
    testnet: "radioBoxSetTestnet",
    regtest: "radioBoxSetRegtest"
  }
};

module.exports = {
  defaults
}