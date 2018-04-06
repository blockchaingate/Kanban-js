var submitRequests = require('./submit_requests');
var pathnames = require('../pathnames');

function getPeerInfoTestNet(output, progress){
  if (typeof output === "string" ){
    output = document.getElementById(output);
  }
  if (typeof progress === "string" ){
    progress = document.getElementById(progress);
  }
  var theRequest = {};
  theRequest[pathnames.rpc.command] = pathnames.rpc.getPeerInfo;  
  submitRequests.submitGET({
    url: `${pathnames.url.known.rpcWithQuery}${encodeURIComponent(JSON.stringify(theRequest))}`
  });

}

module.exports = {
  getPeerInfoTestNet
}