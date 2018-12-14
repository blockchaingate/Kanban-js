"use strict";
require('colors');

function ResponseStatsGlobal () {
  this.requestsReceived = 0;
  this.requestsClosed = 0;
}

ResponseStatsGlobal.prototype.toJSON = function() {
  var result = {};
  result.requestsReceived = this.requestsReceived;
  result.requestsClosed = this.requestsClosed;
  return result;
}

function ResponseWrapper(response, inputOwner) {
  this.response = response;
  this.owner = inputOwner;
  if (inputOwner === null || inputOwner === undefined || typeof inputOwner !== "object") {
    throw `Response owner must be of type object. Instead, I got: ${typeof inputOwner}`;
  }
  if (typeof this.owner.numberOfRequestsRunning !== "number") {
    console.log(`Warning: response owner class does not have a member numberOfRequestsRunning of type number. `.red + `Creating one for you: is this what you wanted? `);
    this.owner.numberOfRequestsRunning = 0;
  } 
  this.owner.numberOfRequestsRunning ++;
  responseStatsGlobal.requestsReceived ++;
}

ResponseWrapper.prototype.end = function(input) {
  this.response.end(input);
  this.owner.numberOfRequestsRunning --;
  this.response.requestsClosed ++;
}

ResponseWrapper.prototype.writeHead = function(
  /**@type {string} */ 
  input,
) {
  this.response.writeHead(input);
}

var responseStatsGlobal = new ResponseStatsGlobal();

module.exports = {
  ResponseWrapper,
  responseStatsGlobal,
}