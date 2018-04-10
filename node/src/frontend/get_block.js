"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');

function getBlock(output, blockHash, progress){
  blockHash = document.getElementById(blockHash);
  if (typeof progress === "undefined"){
    progress = ids.defaults.progressReport
  }
  var theURL = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getBlock.rpcCallLabel, {blockHash: blockHash.value, verbosity: "1"});
  submitRequests.submitGET({
    url: theURL,
    progress: progress,
    result : output,
    callback: jsonToHtml.writeJSONtoDOMComponent
  });
}

module.exports = {
  getBlock
}