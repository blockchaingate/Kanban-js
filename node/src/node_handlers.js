"use strict";

var numSimultaneousCalls = 0;
var maxSimultaneousCalls = 4;

function computeUnspentTransactions(id){

}

function dispatch(request, response, desiredCommand){
  numSimultaneousCalls ++;
  if (numSimultaneousCalls > maxSimultaneousCalls){
    numSimultaneousCalls--;
    response.writeHead(200);
    response.end("Too many node calls");
    return;
  }
  response.writeHead(200);
  computeUnspentTransactions(numSimultaneousCalls);
  response.end(JSON.stringify({
    id : numSimultaneousCalls 
  }));
}

module.exports = {
  computeUnspentTransactions,
  dispatch
}