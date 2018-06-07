"use strict";

var defaults = {
  pageBlockInfo: "pageRPCBlockInfo",
  pageTXInfo: "pageTXInfo",
  pageNetwork: "pageNetwork",
  pageTestGPU: "pageTestGPU",
  pageFabcoinInitialization: "pageFabcoinInitialization",
  progressReport: "spanProgressReport",
  inputBlockHash: "inputBlockHash",
  inputBestBlockIndex: "inputBestBlockIndex",
  inputNodeCallTestMessage: "inputNodeCallTestMessage",
  inputNodeCallTestNonce: "inputNodeCallTestNonce",
  inputNodeCallTestSecretKey: "inputNodeCallTestSecretKey",
  outputRPCBlockInfo: "divKanbanRPCOutputBlockInfo",
  outputRPCTXInfo: "divKanbanRPCOutputTXInfo",
  outputRPCNetwork: "divKanbanRPCOutputNetwork",
  outputGPUTest: "divGPUTestOutput",
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