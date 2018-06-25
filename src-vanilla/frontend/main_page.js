"use strict";
const rpcCallsGeneral = require('./fabcoin_rpc_general');
const rpcCallsNetwork = require('./fabcoin_rpc_network');
const rpcCallsSendReceive = require('./fabcoin_rpc_send_receive');
const rpcCallsMine = require('./fabcoin_rpc_mine');
const rpcCallsProfiling = require('./fabcoin_rpc_profiling');
const fabcoinInitialization = require('./fabcoin_initialization');
const ids = require('./ids_dom_elements');
const pathnames = require('../pathnames');
const myNodes = require('./my_nodes')

function Page() {
  this.fabcoinNetworkRadioIds = {};
  for (var netLabel in pathnames.networkData) {
    this.fabcoinNetworkRadioIds[netLabel] = ids.defaults.radioButtonsNetwork[netLabel];
  }
  this.currentNetworkName = pathnames.networkData.testNetNoDNS.name;
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
    send: {
      ids: {
        page: ids.defaults.pageSend
      },
      verbosity: "0",
      updateFunction: rpcCallsSendReceive.updateSendReceivePage
    },
    mine: {
      ids: {
        page: ids.defaults.pageMine
      },
      updateFunction: rpcCallsMine.updateMiningPage
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
    },
    profiling: {
      ids: {
        page: ids.defaults.pageProfiling
      },
      updateFunction: rpcCallsProfiling.updateProfilingPage
    }
  }
  this.currentPageLabel = null;
}

Page.prototype.initialize = function() {
  this.loadPageSettings();
  var currentRadioId = this.fabcoinNetworkRadioIds[this.currentNetworkName];
  document.getElementById(currentRadioId).checked = true;
  this.initializeCurrentPage();
}

Page.prototype.initializeCurrentPage = function() {
  for (var label in this.pages) {
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
    localStorage.setItem("currentNetworkName", this.currentNetworkName);
  } catch (e) {
    console.log(`While trying to load local storage, got error: ${e}. Is local storage available?`);
  }  
}

Page.prototype.getCurrentTransactionProtocolLabel = function () {
  return pathnames.networkData[this.currentNetworkName].transactionProtocolLabel;
}

Page.prototype.getRPCNetworkOption = function () {
  return pathnames.networkData[this.currentNetworkName].rpcOption;
}

Page.prototype.loadPageSettings = function() {
  try {
    this.currentPageLabel = localStorage.getItem("currentPageLabel");
    var incomingNetworkName = localStorage.getItem("currentNetworkName");
    if (incomingNetworkName in pathnames.networkData) {
      this.currentNetworkName = incomingNetworkName;
    }
  } catch (e) {
    console.log(`While trying to load local storage, got error: ${e}. Is local storage available?`);
  }
}

Page.prototype.getCurrentNetwork = function () {
  return pathnames.networkData[this.currentNetworkName];
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