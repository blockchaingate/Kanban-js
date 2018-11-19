"use strict";
require('colors');

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
}

ResponseWrapper.prototype.end = function(input) {
  this.response.end(input);
  this.owner.numberOfRequestsRunning --;
}

ResponseWrapper.prototype.writeHead = function(
  /**@type {string} */ 
  input,
) {
  this.response.writeHead(input);
}

module.exports = {
  ResponseWrapper,
}