"use strict";
require('colors');
const configuration = require('./configuration');
const miscelaneous = require('./miscellaneous');

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
  this.flagBounceCopyToConsole = true;
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

/**
 * Prepares html with the output stream.
 * @returns {string}
 */
OutputStream.prototype.toArray = function () {
  var result = [];
  if (this.numberOfOutputsFlushed > 0) {
    result.push(`(... ${this.numberOfOutputsFlushed} earlier outputs deleted ...)`);
  }
  for (var i = 0; i < this.recentOutputs.length; i ++) {
    result.push(this.recentOutputs[i]);
  }
  return result;
}

OutputStream.prototype.log = function (data) {
  this.append(data);
}

OutputStream.prototype.append = function (data) {
  var dataToLog = this.idConsole[this.colorIdConsole] + data;
  dataToLog = miscelaneous.trimeWhiteSpaceAtEnds(dataToLog);
  dataToLog = dataToLog.replace("error", "error".bold.red);
  dataToLog = dataToLog.replace("Error", "Error".bold.red);
  dataToLog = dataToLog.replace("ERROR", "ERROR".bold.red);
  dataToLog = dataToLog.replace("HIGHLIGHT", "HIGHLIGHT".red.bold);
  if (this.flagBounceCopyToConsole) {
    console.log(dataToLog);
  }
  if (configuration.getConfiguration().configuration.noLogFiles) {
    return;
  }
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