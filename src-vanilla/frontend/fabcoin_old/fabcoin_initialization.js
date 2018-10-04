"use strict";
const submitRequests = require('./../submit_requests');
const pathnames = require('../../pathnames');
const fabcoinInitialization = require('../../external_connections/fabcoin_old/initialization');
const fabcoinRPC = require('../../external_connections/fabcoin_old/rpc');
const ids = require('./../ids_dom_elements');
const jsonToHtml = require('./../json_to_html');
//const Block = require('../bitcoinjs_src/block');
const globals = require('./../globals');

function getSpanProgress() { 
  return document.getElementById(ids.defaults.progressReport);
}

function getOutputFabcoinInitialization() {
  return document.getElementById(ids.defaults.outputFabcoinInitialization);
}

function callbackFabcoinInitialization(input, outputComponent) {
  var transformer = new jsonToHtml.JSONTransformer();
  transformer.writeJSONtoDOMComponent(input, outputComponent, {});
}

function updateFabcoinInitializationPage() {
  var currentNetwork = globals.mainPage().getCurrentNetwork();
  if (currentNetwork.logFileLink !== undefined && currentNetwork.logFileLink !== null) {
    var theLink = document.getElementById("linkLogFileFabcoin");
    if (theLink === null) {
      return;
    }
    theLink.setAttribute("href", currentNetwork.logFileLink);
  }
}

function killAllFabcoinDaemons() {
  var theURL = fabcoinRPC.getURLFromFabcoinInitializationOLD(pathnames.fabcoinInitializationProcedures.killAll.fabcoinInitialization);
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: callbackFabcoinInitialization    
  });
}

function killAllKanbanDaemons() {
  var theURL = fabcoinRPC.getURLFromFabcoinInitializationOLD(pathnames.fabcoinInitializationProcedures.killAllKanbans.fabcoinInitialization);
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: callbackFabcoinInitialization    
  });
}

function startKanban() {
  var dataDir = `${pathnames.pathsComputedAtRunTime.kanbanProofOfConcentConfigurationFolder}/`;
  var theURL = fabcoinRPC.getURLFromFabcoinInitializationOLD(
    pathnames.fabcoinInitializationProcedures.startKanban.fabcoinInitialization, {
      net: globals.mainPage().getRPCKanbanNetworkOption()
    }
  );
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: callbackFabcoinInitialization    
  });
}

function startFabcoinDaemon(useMining) {
  var mineString = "";
  if (useMining) {
    mineString = "-gen";
  }
  var theURL = fabcoinRPC.getURLFromFabcoinInitializationOLD(
    pathnames.fabcoinInitializationProcedures.startFabcoind.fabcoinInitialization, {
      mine: mineString,
      net: globals.mainPage().getRPCNetworkOption()
    }
  );
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: callbackFabcoinInitialization    
  });
}

function gitPullNode() {
  var theURL = fabcoinRPC.getURLFromFabcoinInitializationOLD(pathnames.fabcoinInitializationProcedures.gitPullNode.fabcoinInitialization);
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: callbackFabcoinInitialization    
  });  
}

function gitPullKanban() {
  var theURL = fabcoinRPC.getURLFromFabcoinInitializationOLD(pathnames.fabcoinInitializationProcedures.gitPullKanban.fabcoinInitialization);
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: callbackFabcoinInitialization    
  });  
}

function gitPullFabcoin() {
  var theURL = fabcoinRPC.getURLFromFabcoinInitializationOLD(pathnames.fabcoinInitializationProcedures.gitPullFabcoin.fabcoinInitialization);
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: callbackFabcoinInitialization    
  });  
}

function makeFabcoin() {
  var theURL = fabcoinRPC.getURLFromFabcoinInitializationOLD(pathnames.fabcoinInitializationProcedures.makeFabcoin.fabcoinInitialization);
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: callbackFabcoinInitialization    
  });  
}

function deleteFabcoinConfiguration() {
  var theURL = fabcoinRPC.getURLFromFabcoinInitializationOLD(
    pathnames.fabcoinInitializationProcedures.deleteFabcoinConfiguration.fabcoinInitialization, {
      folder: globals.mainPage().getCurrentNetwork().folder
    }
  );  
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: callbackFabcoinInitialization    
  });  
}

module.exports = {
  startFabcoinDaemon,
  startKanban,
  killAllFabcoinDaemons,
  gitPullNode,
  gitPullFabcoin,
  gitPullKanban,
  makeFabcoin,
  deleteFabcoinConfiguration,
  updateFabcoinInitializationPage,
}