"use strict";
const rpcCallsGeneral = require('./fabcoin_old/fabcoin_rpc_general');
const rpcCallsNetwork = require('./fabcoin_old/fabcoin_rpc_network');
const rpcCallsSendReceive = require('./fabcoin_old/fabcoin_rpc_send_receive');
const rpcCallsMine = require('./fabcoin_old/fabcoin_rpc_mine');
const rpcCallsProfiling = require('./fabcoin_old/fabcoin_rpc_profiling');
const ids = require('./ids_dom_elements');
const fabcoindOldRPC = require('../external_connections/fabcoin_old/rpc');
const myNodes = require('./my_nodes');
const kanbanRPC = require('./kanbango/rpc');
const miscellaneousFrontEnd = require('./miscellaneous_frontend');
const storage = require('./storage').storage;

function Page() {
  this.fabcoinNetworkRadioIds = {};
  for (var netLabel in fabcoindOldRPC.networkData) {
    this.fabcoinNetworkRadioIds[netLabel] = ids.defaults.radioButtonsNetwork[netLabel];
  }
  this.kanbanNetworkRadioIds = {};
  for (var netLabel in fabcoindOldRPC.networkDataKanban) {
    this.kanbanNetworkRadioIds[netLabel] = ids.defaults.radioButtonsNetworkKanban[netLabel];
  }

  this.currentNetworkName = fabcoindOldRPC.networkData.testNetNoDNS.name;
  this.currentKanbanNetworkName = fabcoindOldRPC.networkDataKanbanProofOfConcept.testKanban.name;
  this.pages = {
    fabcoinInitialization: {
      idPage: ids.defaults.pages.fabcoin.initialization,
    },
    //fabcoinInitializationOLD: {
    //  updateFunction: fabcoinInitialization.updateFabcoinInitializationPage,      
    //},
    fabcoinSmartContract: {
      idPage: ids.defaults.pages.fabcoin.smartContract,
    },
    kanbanGOSendReceive:{
      idPage: ids.defaults.pages.kanbanGOSendReceive
    },
    myLocalKanbanNodes: {
      idPage: ids.defaults.pages.kanbanMyLocalNodes,
      updateFunction: kanbanRPC.theKBNodes.getNodeInformation.bind(kanbanRPC.theKBNodes)
    },
    myNodes: {
      idPage: ids.defaults.pageMyNodes,
      updateFunction: myNodes.updateMyNodes
    },
    kanbanJS: {
      idPage: ids.defaults.pages.kanbanJS,
    },
    fabcoinCrypto: {
      idPage: ids.defaults.pages.fabcoin.crypto,
      updateFunction: null
    },
    kanbanGO: {
      idPage: ids.defaults.pages.kanbanGO,
      updateFunction: null
    },
    send: {
      idPage: ids.defaults.pageSend,
      verbosity: "0",
      updateFunction: rpcCallsSendReceive.updateSendReceivePage
    },
    mine: {
      idPage: ids.defaults.pageMine,
      updateFunction: rpcCallsMine.updateMiningPage
    },
    network: {
      idPage: ids.defaults.pageNetwork,
      updateFunction: rpcCallsNetwork.updateNetworkPage
    },
    testGPU: {
      idPage: ids.defaults.pageTestGPU,
      updateFunction: null
    },
    profiling: {
      idPage: ids.defaults.pageProfiling,
      updateFunction: rpcCallsProfiling.updateProfilingPage
    },
    themes: {
      idPage: ids.defaults.pages.themes
    }
  }
}

Page.prototype.initialize = function() {
  this.initializeInputPlaceholders();
  storage.loadAll();
  storage.variables.currentPage.changeValueHandler = this.initializeCurrentPage.bind(this);
  this.initializeCurrentPage();
  window.onhashchange = storage.onWindowHashChange.bind(storage);
  if (window.kanban.ace.editor === null) {
    window.kanban.ace.editor = window.kanban.ace.ace.edit('aceEditor');
    window.kanban.ace.editor.getSession().setMode('ace/mode/solidity');
    window.kanban.ace.editor.$blockScrolling = Infinity;
  }
  miscellaneousFrontEnd.hookUpHexWithStringInput(
    ids.defaults.fabcoin.inputCrypto.inputAggregateSignature.message, 
    ids.defaults.fabcoin.inputCrypto.inputAggregateSignature.messageHex
  );
}


Page.prototype.initializeInputPlaceholder = function (idInput) {
  var oldInput = document.getElementById(idInput);
  if (oldInput === null) {
    throw(`Input id: ${idInput} not found. `);
  }
  var theInput = oldInput.cloneNode();
  var theParent = oldInput.parentElement;
  var groupContainer = document.createElement("SPAN");
  var label = document.createElement("LABEL");
  label.textContent = theInput.placeholder;
  label.className = "form-control-placeholder";
  groupContainer.className = "form-group";
  theInput.classList.add("form-control");
  groupContainer.appendChild(theInput);
  groupContainer.appendChild(label);
  theParent.replaceChild(groupContainer, oldInput);
  theInput.addEventListener('change', storage.storeInputChange.bind(storage, theInput));
  theInput.addEventListener('keydown', storage.storeInputChange.bind(storage, theInput));
}

Page.prototype.initializeInputPlaceholders = function() {
  var collectionsToPlaceholderify = [
    ids.defaults.kanbanGO.inputSchnorr,
    ids.defaults.kanbanGO.inputAggregateSignature,
    ids.defaults.fabcoin.inputCrypto.inputSchnorrSignature, 
    ids.defaults.fabcoin.inputCrypto.inputAggregateSignature,
    ids.defaults.kanbanJS.inputSchnorr,
    ids.defaults.kanbanGO.inputSendReceive,
    ids.defaults.kanbanGO.inputInitialization,
    ids.defaults.fabcoin.inputInitialization,
    ids.defaults.fabcoin.inputBlockInfo,
  ];
  for (var collectionCounter = 0; collectionCounter < collectionsToPlaceholderify.length; collectionCounter ++) {
    var currentCollection = collectionsToPlaceholderify[collectionCounter];
    for (var label in currentCollection) {
      this.initializeInputPlaceholder(currentCollection[label]);
      storage.registerInputBox(currentCollection[label]);
    }
  }
}

Page.prototype.initializeCurrentPage = function() {
  for (var label in this.pages) {
    var pageId = this.pages[label].idPage;
    document.getElementById(pageId).style.display = "none";
  }
  var currentPageLabel = storage.getVariable(storage.variables.currentPage);
  if (currentPageLabel in this.pages) {
    var pageId = this.pages[currentPageLabel].idPage;
    document.getElementById(pageId).style.display = "";
    var currentPage = this.pages[currentPageLabel];
    if (currentPage.updateFunction !== null && currentPage.updateFunction !== undefined) {
      currentPage.updateFunction();
    }
  }
}

Page.prototype.selectPage = function(pageLabel) {
  storage.setVariable(storage.variables.currentPage, pageLabel, false);
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