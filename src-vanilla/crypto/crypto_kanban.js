"use strict";

const Elliptic = require('elliptic');
const EllipticKeyPair = require('elliptic/lib/elliptic/ec/key');
const hasherSha3 = require('js-sha3');
const Ripemd160 = require('ripemd160');


var secp256k1 = new Elliptic.ec('secp256k1');

function CurveExponent(inputBytesOptional) { 
  this.scalar = null;
  if (inputBytesOptional !== null && inputBytesOptional !== undefined) {
    this.fromBytes(inputBytesOptional);
  }
} 

function CurvePoint() { 
  this.point = null;
} 

CurveExponent.prototype.generateAtRandom = function() {
  this.scalar = Elliptic.genKeyPair();
}

CurvePoint.prototype.exponentiateMe = function (theCurveExponent) {
  this.point = this.point.mul(theCurveExponent.scalar);
}

CurvePoint.prototype.toBytes = function () {
  return this.point.encodeCompressed();
}

CurvePoint.prototype.toHex = function () {
  return Buffer.from(this.point.encodeCompressed()).toString('hex');
}

CurveExponent.prototype.fromBytes = function(input) {
  this.scalar = new EllipticKeyPair(
    secp256k1, {
      priv: Buffer.from(input).toString('hex')
    }
  );
}

CurveExponent.prototype.toBytes = function() {
}

CurveExponent.prototype.toHex = function() {
  return this.scalar.getPrivate('hex');
}

CurveExponent.prototype.getExponent = function() {
  var result = new CurvePoint();
  
  result.point = this.scalar.ec.g.mul(this.scalar.priv);
  return result;
}


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
  return hasher.arrayBuffer()
}

Hashers.prototype.ripemd160 = function (input) {
  var hasher = new Ripemd160();
  hasher.update(input);
  return hasher.digest();
}

Hashers.prototype.ripemd160_ToHex = function (input) {
  var hasher = new Ripemd160();
  hasher.update(input);
  return hasher.digest('hex');
}

var hashes = new Hashers();  

module.exports = {
  hashes,
  secp256k1,
  CurveExponent,
  CurvePoint
}