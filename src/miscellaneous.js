"use strict";

function shortenString(input, desiredMaxSize){
  if (input === ""){
    return input;
  }
  if (input.length < desiredMaxSize){
    return input;
  }
  var numEndChars = (desiredMaxSize - 10) / 2;
  var numOmittedChars = input.length - numEndChars*2;
  if (numOmittedChars<= 0){
    return input;
  }
  return `${input.slice(0, numEndChars)}...(${numOmittedChars} out of ${input.length} omitted)...${input.slice(input.length-numEndChars, input.length)}`; 
}

module.exports = {
  shortenString
}