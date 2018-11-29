"use strict";
const cryptoKanbanHashes = require('./crypto/hashes');
const encodings = require('./crypto/encodings').encodingDefault;
var bigInt = require("big-integer");

function Solidity() {
  this.mapArgumentNamesToInputLabels = {
    "_transactionHash":     {name: "transactionHash", encoding: "hex"},
    "_beneficiary":         {name: "beneficiary", encoding: "hex"},
    "_from":                {name: "transferPointsFrom", encoding: "none"},
    "_to":                  {name: "transferPointsTo", encoding: "none"},
    "_amount":              {name: "transferPointsAmount", encoding: "number"},
    "_company":             {name: "corporationNameHex", encoding: "none"},
    "_companyName":         {name: "corporationNameHex", encoding: "none"},
    "_moneySpent":          {name: "moneySpent", encoding: "number"},
    "_nonce":               {name: "nonce", encoding: "number"},
    "_signature":           {name: "corporationSignature", encoding: "none" },
    "_rewardRatio":         {name: "corporationRatio", encoding: "number"},
    "_fabAddress":          {name: "fabAddress", encoding: "none"},
    "_publicKeyPrefix":     {name: "publicKeyPrefix", encoding: "none"},
    "_publicKeyCurvePoint": {name: "publicKeyCurvePoint", encoding: "none"},
  };
  this.commonTypeLengthsInBytes = {
    "bytes1": 1,
    "bytes32": 32,
    "uint256": 32,
  };
  this.ABI = null;
  this.contractIdDefault = "";
}

Solidity.prototype.getQueryCallContractForFunction = function (functionLabel, values) {
  var query = {};
  query.rpcCall = "callContract";
  var packedData = this.getABIPackingForFunction(functionLabel, values);
  query.data = packedData;
  query.contractId = this.contractIdDefault;
  return query;
}

Solidity.prototype.getABIPackingForFunction = function (functionLabel, values) {
  for (var i = 0; i < this.ABI.length; i ++) {
    var currentABI = this.ABI[i];
    if (currentABI.name === functionLabel) {
      return this.getABIPacking(currentABI, values);
    }
  }
  return null;
}

Solidity.prototype.unpackABIResultForFunction = function (functionLabel, inputHex) {
  for (var i = 0; i < this.ABI.length; i ++) {
    var currentABI = this.ABI[i];
    if (currentABI.name === functionLabel) {
      return this.unpackABIResult(currentABI, inputHex);
    }
  }
  return null;
}

Solidity.prototype.getNumberFromBytes32 = function (input) {
  var result = new bigInt(0);
  for (var i = 0; i < input.length; i ++) {
    result = result.multiply(256);
    result = result.add(input[i]);
    //console.log(" DEBUG: adding: " + input[i]);
  }
  //console.log("DEbug: input length: " + input.length);
  //console.log("DEbug: final result: " + result.toString());
  return result;
}

Solidity.prototype.getValueFromAtomic = function(inputValue, inputType) {
  if (inputType === "uint256") {
    return this.getNumberFromBytes32(inputValue).toString();
  } 
  return inputValue.toString('hex');
}

Solidity.prototype.getValueFromArray = function (unhexed, offset, lengthInMultiplesOf32, type) {
  var result = [];
  for (var i = 0; i < lengthInMultiplesOf32; i ++) {
    var subslice = unhexed.slice(offset + i * 32, offset + (i + 1) * 32);
    result.push(this.getValueFromAtomic(subslice, type));
  }
  return result;
}

Solidity.prototype.unpackABIResult = function (functionSpec, inputHex) {
  var unhexed = encodings.fromHex(inputHex);
  if (unhexed === null) {
    return unhexed;
  }
  var result = {};
  result.DEBUGCommentsABI = functionSpec.outputs;
  var arrayStarts = [];
  var arrayNames = [];
  var arrayType = [];
  //var slicedValues = [];
  //console.log("DEBUG: got to here pt sdf");
  for (var i = 0; i < functionSpec.outputs.length; i ++) {
    var currentVar = functionSpec.outputs[i];
    var currentType = currentVar.type;
    var currentName = currentVar.name;
    var isArray = false;
    if (currentType.endsWith("[]")) {
      isArray = true;
      currentType = currentType.slice(0, currentType.length - 2);
    } 
    if (! (currentType in this.commonTypeLengthsInBytes)) {
      result.error = `Failed to extract length in bytes for ${currentType}`;
      return result;
    }
    var currentValue = unhexed.slice( 32 * i, 32 * (i + 1));
    //slicedValues.push(currentValue);
    if (isArray) {
      var theNumber = this.getNumberFromBytes32(currentValue);
      arrayStarts.push(theNumber.valueOf());
      arrayNames.push(currentName);
      arrayType.push (currentType);
    } else {
      result[currentName] = this.getValueFromAtomic(currentValue, currentType);
    }
  }
  //var arrayLengths = [];
  for (var i = 0; i < arrayStarts.length; i ++) {
    var offset = arrayStarts[i];
    var lengthSlice = unhexed.slice(offset, offset + 32);
    var lengthInMultiplesOf32 = this.getNumberFromBytes32(lengthSlice).valueOf();
    //arrayLengths.push (lengthInMultiplesOf32);
    result[arrayNames[i]] = this.getValueFromArray(unhexed, offset + 32, lengthInMultiplesOf32, arrayType[i]);
  }
  console.log("DEBUG: got to before return");
  console.log("About to return: " + JSON.stringify(result));

  //result.arrayType = arrayType;
  //result.arrayNames = arrayNames;
  //result.arrayStarts = arrayStarts;
  //result.arrayLengths = arrayLengths;
  //result.slicedValues = slicedValues;
  return result;
}

Solidity.prototype.getABIPacking = function (functionSpec, values) {
  console.log("DEBUG: got to abi packing.")
  var result = "";
  var keccakFirst8Hex = cryptoKanbanHashes.hashes.solidityGet8byteHexFromFunctionSpec(functionSpec);
  result += keccakFirst8Hex;
  for (var i = 0; i < functionSpec.inputs.length; i ++) {
    var currentVariableName = functionSpec.inputs[i].name;
    if (! (currentVariableName in this.mapArgumentNamesToInputLabels)) {
      console.log(`WARNING: in function: ${functionSpec.name} input variable ${currentVariableName} has no corresponding input label! Filling up with zeroes. `);
      result += "0".repeat(64);
      continue;
    }
    var argumentInputId = this.mapArgumentNamesToInputLabels[currentVariableName];
    var currentArgument = "0".repeat(64);
    if (typeof argumentInputId === "function") {
      currentArgument = argumentInputId();
    } else {
      var inputRaw = values[argumentInputId.name];
      if (inputRaw === undefined || inputRaw === null) {
        console.log(`Warning: missing argument ${functionSpec.name} with input label: ${argumentInputId.name}. Replacing argument with empty string. `);
        inputRaw = "";
      }
      if (argumentInputId.encoding === "hex") {
        currentArgument =  Buffer.from(inputRaw).toString('hex');        
      } else if (argumentInputId.encoding === "none") {
        currentArgument = inputRaw;
      } else if (argumentInputId.encoding === "number") {
        currentArgument = Number (inputRaw);
        if (isNaN(currentArgument)) {
          currentArgument = 0;
        }
        currentArgument = currentArgument.toString(16);
        currentArgument = "0".repeat(64 - currentArgument.length) + currentArgument;
      }
      console.log(`DEBUG: current arg: ${currentArgument}. Current var ABI: ${JSON.stringify(functionSpec.inputs[i])}`);
    }
    var numberOfZeroesToPad = 64 - currentArgument.length;
    if (numberOfZeroesToPad > 0) {
      currentArgument += "0".repeat(numberOfZeroesToPad);
    }
    result += currentArgument;
  }
  return result;
}

var solidity = new Solidity();

module.exports = {
  solidity
}