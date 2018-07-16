"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
//const Block = require('../bitcoinjs_src/block');
const globals = require('./globals');

function getSpanProgress() { 
  return document.getElementById(ids.defaults.progressReport);
}

function getOutputFabcoinInitialization() {
  return document.getElementById(ids.defaults.outputFabcoinInitialization);
}

function callbackFabcoinInitialization(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent, {});
}

function updateFabcoinInitializationPage() {
  var currentNetwork = globals.mainPage().getCurrentNetwork();
  if (currentNetwork.logFileLink !== undefined && currentNetwork.logFileLink !== null) {
    var theLink = document.getElementById("linkLogFileFabcoin");
    theLink.setAttribute("href", currentNetwork.logFileLink);
  }
}

function killAllFabcoinDaemons() {
  var theURL = pathnames.getURLFromFabcoinInitialization(pathnames.fabcoinInitializationProcedures.killAll.fabcoinInitialization);
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: callbackFabcoinInitialization    
  });
}

function killAllKanbanDaemons() {
  var theURL = pathnames.getURLFromFabcoinInitialization(pathnames.fabcoinInitializationProcedures.killAllKanbans.fabcoinInitialization);
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
  var theURL = pathnames.getURLFromFabcoinInitialization(
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
  var theURL = pathnames.getURLFromFabcoinInitialization(pathnames.fabcoinInitializationProcedures.gitPullNode.fabcoinInitialization);
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: callbackFabcoinInitialization    
  });  
}

function gitPullKanban() {
  var theURL = pathnames.getURLFromFabcoinInitialization(pathnames.fabcoinInitializationProcedures.gitPullKanban.fabcoinInitialization);
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: callbackFabcoinInitialization    
  });  
}

function gitPullFabcoin() {
  var theURL = pathnames.getURLFromFabcoinInitialization(pathnames.fabcoinInitializationProcedures.gitPullFabcoin.fabcoinInitialization);
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: callbackFabcoinInitialization    
  });  
}

function makeFabcoin() {
  var theURL = pathnames.getURLFromFabcoinInitialization(pathnames.fabcoinInitializationProcedures.makeFabcoin.fabcoinInitialization);
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: callbackFabcoinInitialization    
  });  
}

function deleteFabcoinConfiguration() {
  var theURL = pathnames.getURLFromFabcoinInitialization(
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
  killAllFabcoinDaemons,
  gitPullNode,
  gitPullFabcoin,
  gitPullKanban,
  makeFabcoin,
  deleteFabcoinConfiguration,
  updateFabcoinInitializationPage
}