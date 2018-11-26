"use strict";

var maxDeepCopyDepth = 1000;

function deepCopyThroughJSON (input) {
  return JSON.parse(JSON.stringify(input));
}

function deepCopy (input, recursionDepth) {
  if (recursionDepth === undefined || recursionDepth === null) {
    recursionDepth = 0;
  }
  if (recursionDepth >= maxDeepCopyDepth) {;
    throw(`Deep copy reached max copy depth. ${maxDeepCopyDepth}`)
  }
  if (Array.isArray(input)) {
    var result = [];
    for (var counterInput = 0; counterInput < input.length; counterInput ++) {
      result.push(deepCopy(input[counterInput], recursionDepth + 1));
    }
    return result;
  }
  if (typeof input === "object") {
    var result = {};
    for (var label in input) {
      result[label] = deepCopy(input[label], recursionDepth + 1);
    }
    return result;
  }
  return input;
}

function getDurationReadableFromMilliseconds(inputMilliseconds) {
  if (inputMilliseconds > 1500)
    return getDurationReadableFromSeconds(inputMilliseconds / 1000);
  return `${inputMilliseconds} ms`;
}

function getDurationReadableFromSeconds(inputSeconds) {
  if (inputSeconds > 60) {
    return getDurationReadableFromMinutesAndSeconds(Math.floor(inputSeconds / 60), Math.floor(inputSeconds) % 60);
  } 
  if (inputSeconds > 20) {
    inputSeconds = Math.floor(inputSeconds);
  }
  return `${inputSeconds.toFixed(1)} s`;
}

function getDurationReadableFromMinutesAndSeconds(inputMinutes, inputSeconds) {
  if (inputMinutes > 60) {
    return getDurationReadableFromHoursAndMinutes(Math.floor(inputMinutes / 60), inputMinutes % 60);
  }
  return `${inputMinutes} min, ${inputSeconds} s`;
}

function getDurationReadableFromHoursAndMinutes(inputHours, inputMinutes) {
  if (inputHours > 24) {
    return getDurationReadableFromDaysHoursAndMinutes( Math.floor(inputHours / 24), inputHours % 24, inputMinutes);
  }
  return `${inputHours} h, ${inputMinutes} min`;
}

function getDurationReadableFromDaysHoursAndMinutes(inputDays, inputHours, inputMinutes) {
  return `${inputDays} d, ${inputHours} h, ${inputMinutes} min`;
}

function hexVeryShortDisplay(input) {
  return "...";
}

function hexShortenerForDisplay(input) {
  return hexShortenerForDisplaySpecifyNumChars(4, input);
}

function hexMiddleShortenerForDisplay(input) {
  return hexShortenerForDisplaySpecifyNumChars(8, input);
}

function hexShortenerForDisplaySpecifyNumChars(numChars, input){
  if (input.length < numChars * 2 + 2) {
    return input;
  }
  if (typeof input !== "string") {
    return input;
  }
  return `${input.substr(0, numChars)}...${input.substr(input.length - numChars, numChars)}`;
}


function shortenString(input, desiredMaxSize, includeNumOmitted) {
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
  if (includeNumOmitted === undefined || includeNumOmitted === null) {
    includeNumOmitted = true;
  }
  if (!includeNumOmitted) {
    return `${input.slice(0, numEndChars)}...${input.slice(input.length-numEndChars, input.length)}`; 
  }
  return `${input.slice(0, numEndChars)}...(${numOmittedChars} out of ${input.length} omitted)...${input.slice(input.length-numEndChars, input.length)}`; 
}

function removeQuotes(input) {
  if (typeof input !== "string") {
    return input;
  }
  if (input.startsWith('"')) {
    input = input.slice(1);
  }
  if (input.endsWith('"')) {
    input = input.slice(0, input.length - 1);
  }
  return input;
}

function convertToIntegerIfPossible(input) {
  if (input === "") {
    return input;
  }
  try {
    var result = parseInt(input);
    return result;
  } catch (e) {
    return input;
  }
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

function ensureMinCharWidth(charWidth, input) {
  if (typeof input === "number") {
    input = input.toFixed();
  }
  if (typeof input !== "string") {
    return input;
  }
  if (input.length < charWidth) {
    input = "\xa0".repeat(charWidth - input.length) + input;
  }
  return input;
}


module.exports = {
  deepCopy,
  deepCopyThroughJSON,
  hexShortenerForDisplay,
  hexMiddleShortenerForDisplay,
  getDurationReadableFromSeconds,
  getDurationReadableFromMilliseconds,
  shortenString,
  SpeedReport, 
  removeQuotes,
  convertToIntegerIfPossible,
  hexVeryShortDisplay,
  ensureMinCharWidth,
}