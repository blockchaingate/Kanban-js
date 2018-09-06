"use strict";
const Base58 = require('bs58');
const hashes = require('./hashes').hashes;

function Encoding(inputData) {
  this.name = null;
  this.allowedRawLengths = null;
  this.allowedHexLengths = null;
  this.allowedHexCheckLengths = null;
  this.allowedBase58Lengths = null;
  this.allowedBase58CheckLengths = null;
  for (var label in inputData) {
    if (label in this) {
      this[label] = inputData[label];
    }
  }
}

Encoding.prototype.toBase58 = function(inputBytes) {
  return Base58.encode(inputBytes);
}

Encoding.prototype.toBase58Check = function(inputBytes) {
  var bytesWithCheck = this.toBytesWithCheck(inputBytes);
  return this.toBase58(bytesWithCheck);
}

Encoding.prototype.toHex = function(inputBytes) {
  return Buffer.from(inputBytes).toString('hex');
}

Encoding.prototype.computeCheck = function(inputBytes) {
  var oneSha = hashes.sha256(inputBytes);
  var check = hashes.sha256(oneSha);
  return check.slice(0, 4);
}

Encoding.prototype.toBytesWithCheck = function(inputBytes) {
  var inputBufferized = Buffer.concat([Buffer.from([0]), inputBytes]);
  var check = this.computeCheck(inputBufferized);
  var result = Buffer.concat([inputBufferized, check]);
  return result;
}

Encoding.prototype.fromBase58 = function(inputBase58) {
  return Base58.decode(inputBase58);
}

Encoding.prototype.fromHex = function(inputHex) {
  try {
    return Buffer.from(inputHex, "hex");
  } catch (e) {
    return null;
  }
}

Encoding.prototype.fromBytesCheck = function(inputBytes) {
  if (inputBytes === null) {
    return null;
  }
  var check = this.computeCheck(inputBytes.slice(0, inputBytes.length - 4));
  var offset = inputBytes.length - 4;
  for (var counter = 0; counter < 4; counter ++) {
    if (check[counter] != inputBytes[counter + offset]) {
      return null;
    }
  }
  var sliced = inputBytes.slice(0, inputBytes.length - 4);
  return this.fromBytes(sliced);
}

Encoding.prototype.fromBytes = function(inputArbitraryEncoding) {
  if (!(inputArbitraryEncoding.length in this.allowedRawLengths)) {
    return null;
  }
  return inputArbitraryEncoding;
}

Encoding.prototype.fromArbitrary = function(inputArbitraryEncoding) {
  if (inputArbitraryEncoding.length in this.allowedRawLengths) {
    return this.fromBytes(inputArbitraryEncoding);
  }    
  if (inputArbitraryEncoding.length in this.allowedHexLengths) {
    var converted = this.fromHex(inputArbitraryEncoding);
    return this.fromBytes(converted);
  }
  if (inputArbitraryEncoding.length in this.allowedHexCheckLengths) {
    var converted = this.fromHex(inputArbitraryEncoding);
    return this.fromBytesCheck(checked);
  }
  if (inputArbitraryEncoding.length in this.allowedBase58Lengths) {
    var converted = this.fromBase58(inputArbitraryEncoding);
    return this.fromBytes(converted);
  }
  if (inputArbitraryEncoding.length in this.allowedBase58CheckLengths) {
    var converted = this.fromBase58(inputArbitraryEncoding);
    return this.fromBytesCheck(converted);
  }
  return null;
}

var encodingDefault = new Encoding();

module.exports = {
  Encoding,
  encodingDefault
}