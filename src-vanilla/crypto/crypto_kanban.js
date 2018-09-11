"use strict";

const Elliptic = require('elliptic');
const EllipticKeyPair = require('elliptic/lib/elliptic/ec/key');
const hashes = require('./hashes').hashes;
const encodings = require('./encodings');

var encodingPoint = new encodings.Encoding({
  name: "point_secp256k1",
  allowedRawLengths: {
    33: true,
    64: true,
    65: true,
  },
  allowedHexLengths: {
    66: true,
    128: true,
    130: true,
  },
  allowedHexCheckLengths: {
    74: true,
    138: true,
  },
  allowedBase58Lengths: {
    44: true,
		45: true,
  },
  allowedBase58CheckLengths: {
		50: true,
  }
});

var encodingExponent = new encodings.Encoding({
  name: "exponent_secp256k1",
  allowedRawLengths: {
    32: true,
    33: true,
    34: true,
  },
  allowedHexLengths: {
    64: true,
    66: true,
    68: true,
  },
  allowedHexCheckLengths: {
    72: true,
    74: true,
    76: true,
  },
  allowedBase58Lengths: {
    45: true,
		46: true,
		47: true,
  },
  allowedBase58CheckLengths: {
		52: true,
  }
});

var secp256k1 = new Elliptic.ec('secp256k1');

/**
 * Curve exponent: used to exponentiate points on secp256k1. 
 * Used for many purposes, including private keys and signature nonces.
 * @param {*} inputBytesOptional 
 */
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
  this.scalar = secp256k1.genKeyPair().priv;
}

CurvePoint.prototype.exponentiateMe = function(theCurveExponent) {
}

CurvePoint.prototype.toBytesUncompressed = function() {
  if (this.point === null) {
    return "(uninitialized)";
  }
  return Buffer.from(this.point._encode(false));
}

CurvePoint.prototype.toBytes = function() {
  if (this.point === null) {
    return "(uninitialized)";
  }
  return Buffer.from(this.point.encodeCompressed());
}

CurvePoint.prototype.toHexUncompressed = function() {
  if (this.point === null) {
    return "(uninitialized)";
  }
  return Buffer.from(this.point._encode(false)).toString('hex');
}

CurvePoint.prototype.toHex = function() {
  if (this.point === null) {
    return "(uninitialized)";
  }
  return Buffer.from(this.point.encodeCompressed()).toString('hex');
}

CurvePoint.prototype.toBase58 = function() {
  if (this.point === null) {
    return "(uninitialized)";
  }
  return encodingPoint.toBase58(this.toBytes())
}

CurvePoint.prototype.toBase58Check = function() {
  if (this.point === null) {
    return "(uninitialized)";
  }
  return encodingPoint.toBase58Check(this.toBytes())
}

CurvePoint.prototype.fromHex = function(input) {
  this.fromBytes(Buffer.from(input, "hex"));
}

CurvePoint.prototype.fromBytes = function(input) {
  if (input.length === 64) {
    var inputNew = new Uint8Array(65);
    inputNew[0] = 4;
    for (var counterInput = 0; counterInput < input.length; counterInput ++) {
      inputNew[counterInput + 1] = input[counterInput]; 
    }
    input = inputNew;
  }
  console.log(`DEBUG: input: ${input} of length: ${input.length}`);
  var thePair = new EllipticKeyPair(secp256k1, {
    pub: input
  }); 
  this.point = thePair.pub;
}

CurvePoint.prototype.fromArbitrary = function(input) {
  var bytes = encodingPoint.fromArbitrary(input);
  if (bytes === null) {
    throw `Failed to convert ${input} to curve point. `;
  }
  return this.fromBytes(bytes);
}

CurvePoint.prototype.computeEthereumAddressBytes = function() {
  if (this.point === null) {
    throw "Uninitialized curve point";
  }
  var addressBytes = this.toBytesUncompressed().slice(1);
  console.log( "DEBUG: address bytes: " + addressBytes.length);
  var theKeccak = hashes.keccak_256(addressBytes);
  return theKeccak.slice(12);
}

CurvePoint.prototype.computeEthereumAddressHex = function() {
  if (this.point === null) {
    throw "Uninitialized curve point";
  }
  var ethereumBytes = this.computeEthereumAddressBytes(); 
  var result = Buffer.from(ethereumBytes).toString('hex');
  return result;
}

CurvePoint.prototype.computeFABAddressBytes = function() {
  if (this.point === null) {
    throw "Uninitialized curve point";
  }
  var shaedBytes = hashes.sha256(this.toBytes());
  var ripemd160Bytes = hashes.ripemd160(shaedBytes);
  return ripemd160Bytes;
}

CurvePoint.prototype.computeFABAddressHex = function() {
  if (this.point === null) {
    throw "Uninitialized curve point";
  }
  var ethereumBytes = this.computeFABAddressBytes(); 
  var result = Buffer.from(ethereumBytes).toString('hex');
  return result;
}

CurveExponent.prototype.fromBytes = function(input) {
  if (input.length === 33 || input.length === 34) {
    input = input.slice(1, 33);
  }
  var keyPair = new EllipticKeyPair(
    secp256k1, {
      priv: Buffer.from(input).toString('hex')
    }
  );
  this.scalar = keyPair.priv;
}

CurveExponent.prototype.fromArbitrary = function(input) {
  var bytes = encodingExponent.fromArbitrary(input);
  if (bytes === null) {
    throw `Failed to convert ${input} to curve exponent. Bytes: ${bytes}. `;
  }
  return this.fromBytes(bytes);
}

CurveExponent.prototype.toBytes = function() {
  return Buffer.from(this.scalar.toString(16, 2), "hex");
}

CurveExponent.prototype.toHex = function() {
  if (this.scalar === null) {
    return "(null)";
  }
  return this.toBytes().toString('hex');
}

CurveExponent.prototype.toBase58 = function() {
  if (this.scalar === null) {
    return "(null)";
  }
  return encodings.encodingDefault.toBase58(this.toBytes());
}

CurveExponent.prototype.isInitialized = function() {
  if (this.scalar === null) {
    return false;
  }
  return true;
}

CurveExponent.prototype.getExponent = function() {
  if (!this.isInitialized()) {
    throw "Attempt to exponentiate non-initialized curve point. ";
  }
  var result = new CurvePoint();  
  result.point = secp256k1.g.mul(this.scalar);
  return result;
}

module.exports = {
  secp256k1,
  CurveExponent,
  CurvePoint
}