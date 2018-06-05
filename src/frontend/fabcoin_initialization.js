"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
//const Block = require('../bitcoinjs_src/block');

function getSpanProgress(){ 
  return document.getElementById(ids.defaults.progressReport);
}

function getOutputFabcoinInitialization(){
  return document.getElementById(ids.defaults.outputFabcoinInitialization);
}

function fabcoinInitializationCallback(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function startFabcoinDaemon() {
  var theURL = `
${pathnames.url.known.fabcoinInitialization}?command={
"${pathnames.fabcoinInitialization}":"${pathnames.fabcoinInitializationProcedures.startFabcoind.fabcoinInitialization}", 
"net":"${window.kanban.thePage.pages.blockInfo.currentNet}"
}`;

  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputFabcoinInitialization(),
    callback: fabcoinInitializationCallback    
  });
}

function startFabcoinDaemonIfNeeded() {
  startFabcoinDaemon();
}

module.exports = {
  startFabcoinDaemon,
  startFabcoinDaemonIfNeeded
}