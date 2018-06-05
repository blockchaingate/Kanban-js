"use strict";
const rpcCalls = require('./fabcoin_rpc');
const fabcoinInitialization = require('./fabcoin_initialization');
const ids = require('./ids_dom_elements');

function Page() {
  this.pages = {
    fabcoinInitialization:{
      ids: {
        page: ids.defaults.pageFabcoinInitialization
      },
      updateFunction: fabcoinInitialization.startFabcoinDaemonIfNeeded,      
    },
    blockInfo: {
      ids: {
        page: ids.defaults.pageBlockInfo
      },
      currentNet: "-testnet",
      verbosity: "0",
      updateFunction: rpcCalls.getBestBlockHash,
    },
    txInfo: {
      ids: {
        page: ids.defaults.pageTXInfo
      },
      updateFunction: rpcCalls.updateTXInfoPage
    },
    network: {
      ids: {
        page: ids.defaults.pageNetwork
      },
      updateFunction: rpcCalls.getPeerInfo
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
  } catch (e) {
    console.log(`While trying to load local storage, got error: ${e}. Is local storage available?`);
  }  
}

Page.prototype.loadPageSettings = function() {
  try {
    this.currentPageLabel = localStorage.getItem("currentPageLabel");
  } catch (e) {
    console.log(`While trying to load local storage, got error: ${e}. Is local storage available?`);
  }
}

function getPage() {
  if (window.kanban.page === null || window.kanban.page === undefined) {
    window.kanban.page = new Page();
  }
  return window.kanban.page;
}

module.exports = {
  getPage
}