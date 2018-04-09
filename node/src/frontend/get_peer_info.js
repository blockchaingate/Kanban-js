const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');

function getPeerInfoTestNet(output, progress){
  if (typeof progress === "undefined"){
    progress = ids.defaults.progressReport
  }
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getPeerInfo.rpcCallLabel),
    progress: progress,
    result : output,
    callback: jsonToHtml.writeJSONtoDOMComponent
  });

}

module.exports = {
  getPeerInfoTestNet
}