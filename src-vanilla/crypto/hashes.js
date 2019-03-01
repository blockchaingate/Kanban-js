"use strict";

const hasherSha3 = require('js-sha3');
const Ripemd160 = require('ripemd160');
const crypto = require('crypto');

//Wrapper around library: js-sha3 
function Hashers() {
}

Hashers.prototype.sha3_256_ToHex = function(input) {
  return hasherSha3.sha3_256(input);
}

Hashers.prototype.sha3_256 = function(input) {
  var hasher = hasherSha3.sha3_256.create();
  hasher.update(input);
  return hasher.arrayBuffer()
}

Hashers.prototype.keccak_ToHex = function(input) {
  return hasherSha3.keccak256(input);
}

Hashers.prototype.keccak_256 = function(input) {
  var hasher = hasherSha3.keccak256.create();
  hasher.update(input);
  return Buffer.from(hasher.arrayBuffer());
}

Hashers.prototype.ripemd160 = function (input) {
  var hasher = new Ripemd160();
  hasher.update(input);
  return hasher.digest();
}

Hashers.prototype.ripemd160_ToHex = function (input) {
  var hasher = new Ripemd160();
  hasher.update();
  return hasher.digest('hex');
}

Hashers.prototype.sha256 = function (input) {
  return crypto.createHash('sha256').update(input).digest();
}

/** @returns {String} */
Hashers.prototype.solidityGetFunctionSignature = function(abi) {
  var functionSignature = "";
  functionSignature += abi.name;
  functionSignature += "(";
  for (var counterType = 0; counterType < abi.inputs.length; counterType ++) {
    functionSignature += abi.inputs[counterType].type;
    if (counterType !== abi.inputs.length - 1) {
      functionSignature += ",";
    }
  }
  functionSignature += ")";
  return functionSignature;
}

/** @returns {String} */
Hashers.prototype.solidityGet8byteHexFromFunctionSpec = function(abi) {
  var functionSignature = this.solidityGetFunctionSignature(abi);
  var keccak = this.keccak_ToHex(functionSignature);
  var keccakFirst8Hex = keccak.slice(0, 8);
  return keccakFirst8Hex;
}

var hashes = new Hashers();  

module.exports = {
  hashes
}
