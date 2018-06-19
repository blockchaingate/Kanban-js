"use strict";

function shortenString(input, desiredMaxSize) {
  if (input === "") {
    return input;
  }
  if (input.length < desiredMaxSize) {
    return input;
  }
  var numEndChars = (desiredMaxSize - 10) / 2;
  var numOmittedChars = input.length - numEndChars * 2;
  if (numOmittedChars <= 0) {
    return input;
  }
  return `${input.slice(0, numEndChars)}...(${numOmittedChars} out of ${input.length} omitted)...${input.slice(input.length-numEndChars, input.length)}`; 
}

function SpeedReport (input) {
  this.name = input.name;
  this.total = input.total;
  this.soFarProcessed = 0;
  this.timeStart = null;
  if (input.timeStart !== undefined) {
    input.timeStart = input.timeStart;
  } else {
    this.timeStart = (new Date()).getTime();
  }
  this.timeProgress = null;
}

SpeedReport.prototype.toString = function () {
  var result = "";
  if (this.timeProgress === null || this.soFarProcessed === 0) {
    result += `${this.name}: not started yet. `;
  }
  result += `${this.name}: <b>${this.soFarProcessed}</b> out of <b>${this.total}</b> processed`;
  if (this.timeProgress !== null) {
    var timeElapsed = this.timeProgress - this.timeStart;
    var speed = this.soFarProcessed / timeElapsed * 1000;
    result += ` in ${timeElapsed} ms, speed: <b>${speed.toFixed(1)}</b> per second.`;
  }
  return result;
}

module.exports = {
  shortenString,
  SpeedReport
}