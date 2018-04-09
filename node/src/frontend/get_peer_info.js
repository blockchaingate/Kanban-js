const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');

function getPeerInfoTestNet(output, progress){
  if (typeof progress === "undefined"){
    progress = ids.defaults.progressReport
  }

  var theRequest = {};
  theRequest[pathnames.rpc.command] = pathnames.rpc.getPeerInfo;  
  submitRequests.submitGET({
    url: `${pathnames.url.known.rpc}?${pathnames.rpc.command}=${encodeURIComponent(JSON.stringify(theRequest))}`,
    progress: progress,
    result : output 
  });

}

module.exports = {
  getPeerInfoTestNet
}