"use strict";
const rpcCalls = require('./fabcoin_rpc');
const ids = require('./ids_dom_elements');

function Page(){
  this.pages = {
    blockInfo: {
      ids: {
        page: ids.defaults.pageBlockInfo
      },
      currentNet: "-testnet",
      updateFunction: rpcCalls.getBestBlockHash
    }
  }
  this.currentPageLabel = null;
}

Page.prototype.initialize = function(){
  this.loadPageSettings();
  this.initializeCurrentPage();
}

Page.prototype.initializeCurrentPage = function(){
  if (this.currentPageLabel in this.pages){
    var currentPage = this.pages[this.currentPageLabel]
    if (currentPage.updateFunction !== null && currentPage.updateFunction !== undefined){
      currentPage.updateFunction();
    }
  }
}

Page.prototype.selectPage = function(pageLabel){
  this.currentPageLabel = pageLabel;
  this.initializeCurrentPage();
  this.storePageSettings();
}

Page.prototype.storePageSettings = function(){
  try {
    localStorage.setItem("currentPageLabel", this.currentPage);
  } catch (e) {
    console.log(`While trying to load local storage, got error: ${e}. Is local storage available?`);
  }  
}

Page.prototype.loadPageSettings = function(){
  try {
    this.currentPageLabel = localStorage.getItem("currentPageLabel");
  } catch (e) {
    console.log(`While trying to load local storage, got error: ${e}. Is local storage available?`);
  }
}

function getPage(){
  if (window.kanban.page === null || window.kanban.page === undefined){
    window.kanban.page = new Page();
  }
  return window.kanban.page;
}

module.exports = {
  getPage
}