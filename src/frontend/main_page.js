"use strict";
const rpcCallsGeneral = require('./fabcoin_rpc_general');
const rpcCallsBlocks = require('./fabcoin_rpc_blocks');
const rpcCallsNetwork = require('./fabcoin_rpc_network');
const rpcCallsTransactions = require('./fabcoin_rpc_transactions');
const fabcoinInitialization = require('./fabcoin_initialization');
const ids = require('./ids_dom_elements');
const pathnames = require('../pathnames');
const myNodes = require('./my_nodes')

function Page() {
  this.fabcoinNetworks = {
    mainnet: {
      name: "-mainnet",
      logFileLink: pathnames.url.known.logFileMainNet,
      radioBoxId: ids.defaults.raioBoxesNetwork.mainnet
    },
    testnet: {
      name: "-testnet",
      logFileLink: pathnames.url.known.logFileTestNet,
      radioBoxId: ids.defaults.raioBoxesNetwork.testnet
    },
    regtest: {
      name: "-regtest",
      logFileLink: null,
      radioBoxId: ids.defaults.raioBoxesNetwork.regtest
    }
  }
  this.currentNet = this.fabcoinNetworks.testnet.name;
  this.allowedNetworkNames = {};
  for (var label in this.fabcoinNetworks) {
    this.allowedNetworkNames[this.fabcoinNetworks[label].name] = label;
  }
  this.pages = {
    fabcoinInitialization: {
      ids: {
        page: ids.defaults.pageFabcoinInitialization
      },
      updateFunction: fabcoinInitialization.updateFabcoinInitializationPage,      
    },
    myNodes: {
      ids: {
        page: ids.defaults.pageMyNodes
      },
      updateFunction: myNodes.updateMyNodes
    },
    blockInfo: {
      ids: {
        page: ids.defaults.pageBlockInfo
      },
      verbosity: "0",
      updateFunction: rpcCallsBlocks.updateBlockInfoPage,
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

Page.prototype.getCurrentNetwork = function () {
  if (this.currentNet in this.allowedNetworkNames) {
    var networkNameInternal = this.allowedNetworkNames[this.currentNet];
    return this.fabcoinNetworks[networkNameInternal];
  }
  return this.fabcoinNetworks.testnet;
}

Page.prototype.initialize = function() {
  this.loadPageSettings();
  var currentNet = this.getCurrentNetwork();
  document.getElementById(currentNet.radioBoxId).checked = true;
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
  try {
    this.currentPageLabel = localStorage.getItem("currentPageLabel");
    var currentNetCandidate = localStorage.getItem("currentNet");
    if (currentNetCandidate in this.allowedNetworkNames) {
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