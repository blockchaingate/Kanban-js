"use strict";
require('colors');

function OutputStream() {
  /**@type {string[]} */
  this.recentOutputs = [];
  this.numberOfOutputsFlushed = 0;
  this.maximumLength = 100;
  this.lengthToTrimTo = 5;
  /**@type {string[]} */
  this.idConsole = "";
  this.colorIdConsole = "white";
  /**@type {string[]} */
  this.idHTML = "";
}

/**
 * Prepares html with the output stream and erases the history.
 * @returns {string}
 */
OutputStream.prototype.toStringWithFlush = function () {
  var result = this.toString();
  this.flush();
  return result;
}

/**
 * Erases the stream history.
 */
OutputStream.prototype.flush = function () {
  this.numberOfOutputsFlushed += this.recentOutputs.length;
  this.recentOutputs = [];
}

/**
 * Prepares html with the output stream.
 * @returns {string}
 */
OutputStream.prototype.toString = function () {
  var result = "";
  if (this.numberOfOutputsFlushed > 0) {
    result += `(... ${this.numberOfOutputsFlushed} earlier outputs deleted ...)\n<br>\n `;
  }
  result += this.recentOutputs.join("\n<br>\n");
  return result;
}

OutputStream.prototype.append = function (data) {
  console.log(this.idConsole[this.colorIdConsole] + data);
  if (this.recentOutputs.length >= this.maximumLength ) {
    var oldOutputs = this.recentOutputs;
    this.recentOutputs = [];
    for (var i = oldOutputs.length - this.lengthToTrimTo; i < oldOutputs.length; i ++) {
      this.recentOutputs.push(oldOutputs[i]);
    }
    this.numberOfOutputsFlushed += oldOutputs.length - this.lengthToTrimTo + 1;
  }
  this.recentOutputs.push(data);
}

module.exports = {
  OutputStream
}