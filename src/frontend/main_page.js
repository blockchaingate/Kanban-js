"use strict";
const rpcCallsGeneral = require('./fabcoin_rpc_general');
const rpcCallsBlock = require('./fabcoin_rpc_block');
const rpcCallsNetwork = require('./fabcoin_rpc_network');
const rpcCallsTransactions = require('./fabcoin_rpc_transactions');
const fabcoinInitialization = require('./fabcoin_initialization');
const ids = require('./ids_dom_elements');

function Page() {
  this.currentNet = "-testnet";
  this.pages = {
    fabcoinInitialization:{
      ids: {
        page: ids.defaults.pageFabcoinInitialization
      },
      //updateFunction: fabcoinInitialization.startFabcoinDaemonIfNeeded,      
    },
    blockInfo: {
      ids: {
        page: ids.defaults.pageBlockInfo
      },
      verbosity: "0",
      updateFunction: rpcCallsBlock.updateBlockInfoPage,
    },
    txInfo: {
      ids: {
        page: ids.defaults.pageTXInfo
      },
      updateFunction: rpcCallsTransactions.updateTXInfoPage
    },
    network: {
      ids: {
        page: ids.defaults.pageNetwork
      },
      updateFunction: rpcCallsNetwork.updateNetworkPage
    },
    testGPU: {
      ids: {
        page: ids.defaults.pageTestGPU
      },
      updateFunction: null
    }
  }
  this.currentPageLabel = null;
}

Page.prototype.initialize = function() {
  this.loadPageSettings();
  this.initializeCurrentPage();
}

Page.prototype.initializeCurrentPage = function() {
  for (var label in this.pages){
    document.getElementById(this.pages[label].ids.page).style.display = "none";
  }
  if (this.currentPageLabel in this.pages) {
    document.getElementById(this.pages[this.currentPageLabel].ids.page).style.display = "";
    var currentPage = this.pages[this.currentPageLabel];
    if (currentPage.updateFunction !== null && currentPage.updateFunction !== undefined) {
      currentPage.updateFunction();
    }
  }
}

Page.prototype.selectPage = function(pageLabel) {
  this.currentPageLabel = pageLabel;
  this.initializeCurrentPage();
  this.storePageSettings();
}

Page.prototype.storePageSettings = function() {
  try {
    localStorage.setItem("currentPageLabel", this.currentPageLabel);
    localStorage.setItem("currentNet", this.currentNet);
  } catch (e) {
    console.log(`While trying to load local storage, got error: ${e}. Is local storage available?`);
  }  
}

Page.prototype.loadPageSettings = function() {
  var allowedCurrentNetValues = {
    "-mainnet": true,
    "": true,
    "-testnet": true,
    "-regtest": true
  }
  try {
    this.currentPageLabel = localStorage.getItem("currentPageLabel");
    var currentNetCandidate = localStorage.getItem("currentNet");
    if (currentNetCandidate in allowedCurrentNetValues) {
      this.currentNet = currentNetCandidate;
    }
  } catch (e) {
    console.log(`While trying to load local storage, got error: ${e}. Is local storage available?`);
  }
}

function getPage() {
  if (window.kanban.thePage === null || window.kanban.thePage === undefined) {
    window.kanban.thePage = new Page();
  }
  return window.kanban.thePage;
}

module.exports = {
  getPage
}