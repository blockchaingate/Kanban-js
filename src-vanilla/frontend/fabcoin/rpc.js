"use strict";
const fabRPCSpec = require('../../external_connections/fabcoin/rpc');
const pathnames = require('../../pathnames');
const ids = require('../ids_dom_elements');
const globals = require('../globals');
const submitRequests = require('../submit_requests');
const jsonToHtml = require('../json_to_html');
const miscellaneousBackend = require('../../miscellaneous');
const miscellaneousFrontEnd = require('../miscellaneous_frontend');

function FabNode () {
  var inputFabBlock = ids.defaults.fabcoin.inputBlockInfo;
  this.transformersStandard = {
    blockHash: this.getSetInputAndRunWithShortener(inputFabBlock.blockHash, "getBlockByHash"),
    shortener: {
      transformer: miscellaneousBackend.hexShortenerForDisplay
    },
    extremeShortener: {
      transformer: miscellaneousBackend.hexVeryShortDisplay
    },
    transactionId: this.getSetInputAndRunWithShortener(inputFabBlock.txid, "getTransactionById"),
    transactionHexDecoder: this.getSetInputAndRunWithShortener(inputFabBlock.txHex, "decodeTransactionRaw"),
    setAddress: this.getSetInputWithShortener(inputFabBlock.address),
    setAddressWithVout: {
      clickHandler: this.setAddressWithVout,
      transformer: miscellaneousBackend.hexShortenerForDisplay
    },
  };

  this.outputOptions = {
    transformers: {
      previousblockhash: this.transformersStandard.blockHash,
      nextblockhash: this.transformersStandard.blockHash,
      blockhash: this.transformersStandard.blockHash,    
      hex: this.transformersStandard.transactionHexDecoder,  
      hash: this.transformersStandard.blockHash,
      chainwork: this.transformersStandard.shortener,
      hashStateRoot: this.transformersStandard.shortener,
      hashUTXORoot: this.transformersStandard.shortener,
      merkleroot: this.transformersStandard.shortener,
      nonce: this.transformersStandard.shortener,
      "tx.${number}": this.transformersStandard.transactionId,
      txid: this.transformersStandard.transactionId,
      "details.${number}.address": this.transformersStandard.setAddress,
      "vout.${number}.scriptPubKey.addresses.${number}": this.transformersStandard.setAddressWithVout
    },
  };

  this.theFunctions = {
    getBlockByHeight: {
      inputs: {
        blockNumber: inputFabBlock.blockNumber
      },
      outputs: inputFabBlock.blockHash,
      callback: this.callbackGetBlockByHeight,
      outputOptions: {
        transformers: {
          singleEntry: this.transformersStandard.blockHash
        }
      }
    },
    generateBlocks: {
      inputs: {
        numberOfBlocks: inputFabBlock.numberOfBlocksToGenerate
      },
      outputOptions: {
        transformers: {
          "${number}": this.transformersStandard.blockHash
        }
      }
    },
    getBlockCount: {
      outputs: inputFabBlock.blockNumber
    },
    getBestBlockHash: {
      outputs: inputFabBlock.blockHash,
      outputOptions: {
        transformers: {
          singleEntry: this.transformersStandard.blockHash
        }
      }
    },
    getBlockByHash: {
      inputs: {
        hash: inputFabBlock.blockHash
      },
      outputs: {
        height: inputFabBlock.blockNumber
      },
    },
    getTransactionById: {
      inputs: {
        txid: inputFabBlock.txid
      },
      outputs: {
        hex: inputFabBlock.txHex
      }, 
    },
    decodeTransactionRaw: {
      inputs: {
        hexString: inputFabBlock.txHex
      }
    },
    dumpPrivateKey: {
      inputs: {
        address: inputFabBlock.address
      },
      outputs: inputFabBlock.privateKey
    }
    //for labels please use the name of the rpc call found in fabRPCSpec.rpcCalls
  };  
}

FabNode.prototype.combineClickHandlers = function (/**@type {function[]}*/ functionArray, container, content, extraData) {
  for (var counterFunction = 0; counterFunction < functionArray.length; counterFunction ++) {
    functionArray[counterFunction](container, content);
  }
}

FabNode.prototype.getSetInputAndRunWithShortener = function (idOutput, functionLabelToFun) {
  var setter = this.setInput.bind(this, idOutput);
  var runner = this.run.bind(this, functionLabelToFun);
  return {
    clickHandler: this.combineClickHandlers.bind(this, [setter, runner]),
    transformer: miscellaneousBackend.hexShortenerForDisplay
  };  
}

FabNode.prototype.getSetInputNoShortener = function (idOutput) {
  return {
    clickHandler: this.setInput.bind(this, idOutput)
  };  
}

FabNode.prototype.getSetInputWithShortener = function (idOutput) {
  return {
    clickHandler: this.setInput.bind(this, idOutput),
    transformer: miscellaneousBackend.hexShortenerForDisplay
  };  
}

FabNode.prototype.setAddressWithVout = function (container, content, extraData) {
  var extraDataString = JSON.stringify(extraData);
  console.log(`DEBUG: Content: ${content}, extra data: ${extraDataString}`);
  submitRequests.updateValue(ids.defaults.fabcoin.inputBlockInfo.address, content);
  submitRequests.updateValue(ids.defaults.fabcoin.inputBlockInfo.vout, extraData.labelArray[extraData.labelArray.length - 1]);
}

FabNode.prototype.setInput = function (idToSet, container, content, extraData) {
  //var extraDataString = JSON.stringify(extraData);
  //console.log(`DEBUG: Content: ${content}, extra data: ${extraDataString}`);
  submitRequests.updateValue(idToSet, content);
}

FabNode.prototype.convertToCorrectType = function(functionLabel, variableName, inputRaw) {
  if (!(functionLabel in fabRPCSpec.rpcCalls)) {
    throw `While converting types, failed to find function ${functionLabel}`;
  }
  var currentFunction = fabRPCSpec.rpcCalls[functionLabel];
  if (currentFunction.types === undefined || currentFunction.types === null) {
    return inputRaw;
  }
  var currentType = currentFunction.types[variableName]; 
  if (currentType === undefined || currentType === null) {
    return inputRaw;
  }
  if (currentType === "number") {
    return Number(inputRaw);
  }
  return inputRaw;
}

FabNode.prototype.getArguments = function(functionLabel) {
  if (! (functionLabel in fabRPCSpec.rpcCalls) ) {
    throw (`Function label ${functionLabel} not found among the listed rpc calls. `);
  }
  var theArguments = {};
  var functionFrontend = this.theFunctions[functionLabel];
  if (functionFrontend === null || functionFrontend === undefined) {
    return theArguments;
  }
  var currentInputs = functionFrontend.inputs;
  for (var inputLabel in currentInputs) {
    var inputId = currentInputs[inputLabel];
    submitRequests.highlightInput(inputId);
    var rawInput = document.getElementById(inputId).value;
    theArguments[inputLabel] = this.convertToCorrectType(functionLabel, inputLabel, rawInput);
  }
  var currentInputsBase64 = functionFrontend.inputsBase64;
  if (currentInputsBase64 !== null && currentInputsBase64 !== undefined) {
    for (var inputLabel in currentInputsBase64) {
      var theValue =  document.getElementById(currentInputsBase64[inputLabel]).value;
      submitRequests.highlightInput(currentInputsBase64[inputLabel]);
      theArguments[inputLabel] = Buffer.from(theValue).toString('base64');
    }
  }
  return theArguments;
}

FabNode.prototype.callbackGetBlockByHeight = function (functionLabel, input, output) {
  this.callbackStandard(functionLabel, input, output);

}

FabNode.prototype.callbackStandard = function(functionLabel, input, output) {
  var transformer = new jsonToHtml.JSONTransformer();
  var currentFunction = this.theFunctions[functionLabel];
  var currentOptions = this.outputOptions;
  if (currentFunction !== undefined && currentFunction !== null) {
    if (currentFunction.outputOptions !== null && currentFunction.outputOptions !== undefined) {
      currentOptions = currentFunction.outputOptions;
    }
  }
  transformer.writeJSONtoDOMComponent(input, output, currentOptions);
  if (!(functionLabel in this.theFunctions)) {
    return;
  }
  var currentOutputs = currentFunction.outputs;
  if (currentOutputs === undefined || currentOutputs === null) {
    return;
  }
  try {
    var inputParsed = JSON.parse(input);

    if (typeof currentOutputs === "string") {
      submitRequests.updateValue(currentOutputs, miscellaneousBackend.removeQuotes(input));
    }
    if (typeof currentOutputs === "object") {
      for (var label in currentOutputs) {
        submitRequests.updateValue(currentOutputs[label], miscellaneousBackend.removeQuotes(inputParsed[label]))
      }
    } 
  } catch (e) {
    throw(`Fatal error parsing: ${input}. ${e}`);
  }
}

FabNode.prototype.run = function(functionLabel) {
  var theArguments = this.getArguments(functionLabel);
  var messageBody = fabRPCSpec.getPOSTBodyFromRPCLabel(functionLabel, theArguments);
  var theURL = `${pathnames.url.known.fabcoin.rpc}`;
  var currentResult = ids.defaults.fabcoin.outputFabcoinBlockInfo;
  var currentProgress = globals.spanProgress();
  var callbackCurrent = this.callbackStandard;
  var functionFrontend = this.theFunctions[functionLabel];
  if (functionFrontend !== undefined) {
    if (functionFrontend.callback !== undefined && functionFrontend.callback !== null) {
      callbackCurrent = functionFrontend.callback;
    }  
  }
  callbackCurrent = callbackCurrent.bind(this, functionLabel);
  theURL += `?${fabRPCSpec.urlStrings.command}=${messageBody}`;
  submitRequests.submitGET({
    url: theURL,
    progress: currentProgress,
    callback: callbackCurrent,
    result: currentResult
  });

}

var fabNode = new FabNode();

module.exports = {
  fabNode
}