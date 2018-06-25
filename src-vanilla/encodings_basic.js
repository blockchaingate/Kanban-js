"use strict";

var hexDigitsLowerCaseString = "abcdef0123456789";
var hexDigitsLowerCaseObject = {};
for (var counterLetter = 0; counterLetter < hexDigitsLowerCaseString.length; counterLetter ++) {
  hexDigitsLowerCaseObject[hexDigitsLowerCaseString[counterLetter]] = true;
}

var hexDigitsUpperCaseString = "abcdef0123456789";
var hexDigitsUpperCaseObject = {};
for (var counterLetter = 0; counterLetter < hexDigitsUpperCaseString.length; counterLetter ++) {
  hexDigitsUpperCaseObject[hexDigitsUpperCaseString[counterLetter]] = true;
}

function isHexStringGivenCase(input, hexDigitsObject) {
  if (typeof input !== "string") {
    return false;
  }
  for (var counterString = 0; counterString < input.length; counterString ++) {
    if (!(input[counterString] in hexDigitsObject)) {
      return false;
    }
  }
  return true;
}

function isHexStringLowerCase(input) {
  return isHexStringGivenCase(input, hexDigitsLowerCaseObject);
}

function isHexStringUpperCase(input) {
  return isHexStringGivenCase(input, hexDigitsUpperCaseObject);
}


module.exports = {
  isHexStringLowerCase, 
  isHexStringUpperCase
}
