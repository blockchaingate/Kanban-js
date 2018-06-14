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

function fabcoinInitializationCallback(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
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
    callback: fabcoinInitializationCallback    
  });
}

function startFabcoinDaemon(useMining) {
  var mineString = "";
  if (useMining) {
    mineString = "-gen";
  }
  var theURL = pathnames.getURLFromFabcoinInitialization(
    pathnames.fabcoinInitializationProcedures.startFabcoind.fabcoinInitialization, {
      mine: mineString
    }
  );
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: fabcoinInitializationCallback    
  });
}

function gitPullNode() {
  var theURL = pathnames.getURLFromFabcoinInitialization(pathnames.fabcoinInitializationProcedures.gitPullNode.fabcoinInitialization);
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: fabcoinInitializationCallback    
  });  
}

function gitPullFabcoin() {
  var theURL = pathnames.getURLFromFabcoinInitialization(pathnames.fabcoinInitializationProcedures.gitPullFabcoin.fabcoinInitialization);
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: fabcoinInitializationCallback    
  });  
}

function makeFabcoin() {
  var theURL = pathnames.getURLFromFabcoinInitialization(pathnames.fabcoinInitializationProcedures.makeFabcoin.fabcoinInitialization);
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: fabcoinInitializationCallback    
  });  
}

function deleteFabcoinConfiguration() {
  var theURL = pathnames.getURLFromFabcoinInitialization(
    pathnames.fabcoinInitializationProcedures.deleteFabcoinConfiguration.fabcoinInitialization, {
      folder: getNetworkDataFromRPCNetworkOption(globals.mainPage().getRPCNetworkOption()).folder
    }
  );  
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: fabcoinInitializationCallback    
  });  
}


module.exports = {
  startFabcoinDaemon,
  killAllFabcoinDaemons,
  gitPullNode,
  gitPullFabcoin,
  makeFabcoin,
  deleteFabcoinConfiguration,
  updateFabcoinInitializationPage
}