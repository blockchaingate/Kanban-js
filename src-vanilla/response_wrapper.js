"use strict";
require('colors');

function ResponseStatsGlobal () {
  this.requestTypes = {
    apiRequests: 0,
    fileRequests: 0,
    httpRequestsRedirectedToHttps: 0,
    numberOfFailuresToParseURL: 0,
    numberOfPings: 0, 
  };  
  this.requestsReceived = 0;
  this.requestsClosed = 0;
  this.numberOfWritesAndEnds = 0;
  this.numberOfWriteHeads = 0;

  this.numberOfRequestsRunning = 0;
  this.maximumNumberOfRequestsRunning = 30;
}

ResponseStatsGlobal.prototype.toJSON = function() {
  var result = {};
  result.requestsReceived = this.requestsReceived;
  result.requestsClosed = this.requestsClosed;
  result.writes = this.numberOfWritesAndEnds;
  result.headersWritten = this.numberOfWriteHeads;
  result.requestTypes = this.requestTypes;
  var sum = 0;
  for (var label in this.requestTypes) {
    sum += this.requestTypes[label];
  }
  if (sum != this.requestsReceived) {
    result.error = `Warning: the stats appear to be incorrect: the sum of request types ${sum} does not match the total requests ${this.requestsReceived}. Please let us know of this error so we can fix it. `;
  }
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
  responseStatsGlobal.requestsClosed ++;
  responseStatsGlobal.numberOfWritesAndEnds ++;
}

ResponseWrapper.prototype.write = function(data) {
  this.response.write(data);
  responseStatsGlobal.numberOfWritesAndEnds ++;
}

ResponseWrapper.prototype.writeHead = function(
  /**@type {string} */ 
  input,
  options,
) {
  this.response.writeHead(input, options);
  responseStatsGlobal.numberOfWriteHeads ++;
}

var responseStatsGlobal = new ResponseStatsGlobal();

module.exports = {
  ResponseWrapper,
  responseStatsGlobal,
}