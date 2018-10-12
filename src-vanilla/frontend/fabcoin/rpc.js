"use strict";
const fabRPCSpec = require('../../external_connections/fabcoin/rpc');
const pathnames = require('../../pathnames');
const ids = require('../ids_dom_elements');
const globals = require('../globals');
const submitRequests = require('../submit_requests');
const jsonToHtml = require('../json_to_html');
const miscellaneousBackend = require('../../miscellaneous');
const miscellaneousFrontEnd = require('../miscellaneous_frontend');
const jsonic = require('jsonic');

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
    setTxInputVoutAndValue: {
      clickHandler: this.setTxInputVoutAndValue.bind(this),
    },
    setContractId: this.getSetInputWithShortener(inputFabBlock.contractId),
  };

  this.outputOptionsStandard = {
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
      "details.${number}.amount": this.transformersStandard.setTxInputVoutAndValue,
      "details.${number}.vout": this.transformersStandard.setTxInputVoutAndValue,
    },
  };
  this.outputOptionsTransaction = {
    transformers: {
      hash: this.transformersStandard.transactionId,
      txid: this.transformersStandard.transactionId,
      "details.${number}.address": this.transformersStandard.setAddress,
      "vout.${number}.scriptPubKey.addresses.${number}": this.transformersStandard.shortener,
      "vout.${number}.n": this.transformersStandard.setTxInputVoutAndValue,
      "vout.${number}.value": this.transformersStandard.setTxInputVoutAndValue,
      "vout.${number}.scriptPubKey.asm": this.transformersStandard.shortener,
      "vout.${number}.scriptPubKey.hex": this.transformersStandard.shortener,
      hex: this.transformersStandard.transactionHexDecoder,
      "vin.${number}.txid": this.transformersStandard.transactionId,
      "vin.${number}.scriptSig.asm": this.transformersStandard.shortener,
      "vin.${number}.scriptSig.hex": this.transformersStandard.shortener,
    }
  };

  this.outputOptionsContract = {
    transformers: {
      address: this.transformersStandard.setContractId,
      hash160: this.transformersStandard.extremeShortener,
      txid: this.transformersStandard.transactionId,
      sender: this.transformersStandard.setAddress
    }
  }

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
      },
      outputOptions: this.outputOptionsTransaction,
    },
    dumpPrivateKey: {
      inputs: {
        address: inputFabBlock.address
      },
      outputs: inputFabBlock.privateKey
    },
    createRawTransaction: {
      inputs: {
        inputs: this.getObjectFromInput.bind(this, inputFabBlock.txInputs),
        outputs: this.getObjectFromInput.bind(this, inputFabBlock.txOutputs),
      },
      outputs: inputFabBlock.txHex,
      outputOptions: {
        transformers: {
          singleEntry: this.transformersStandard.transactionHexDecoder
        }
      },
    },
    signRawTransaction: {
      inputs: {
        hexString: inputFabBlock.txHex
      },
      outputs: {
        hex: inputFabBlock.txHex,
      },
      outputOptions: this.outputOptionsTransaction
    },
    sendRawTransaction: {
      inputs: {
        rawTransactionHex: inputFabBlock.txHex
      },
      outputOptions: this.outputOptionsTransaction
    },
    getRawMempool: {
      outputOptions: {
        transformers: {
          "${number}" : this.transformersStandard.transactionId
        }
      }
    },
    createContract: {
      inputs: {
        contractHex: inputFabBlock.contractHex
      },
      outputOptions: this.outputOptionsContract,
    },
    callContract: {
      inputs: {
        contractId: inputFabBlock.contractId,
        data: inputFabBlock.contractData,
      },
      outputOptions: this.outputOptionsContract,
    },
    sendToContract: {
      inputs: {
        contractId: inputFabBlock.contractId,
        data: inputFabBlock.contractData,
        amount: inputFabBlock.walletAmount,
      },
      outputOptions: this.outputOptionsContract,
    },
    listContracts: {
      outputOptions: {
        transformers: {
          "${label}" : this.transformersStandard.setContractId
        }
      }
    }
  };  
}

FabNode.prototype.getObjectFromInput = function(inputId) {
  var rawInput = document.getElementById(inputId).value;
  var outputObject = jsonic(rawInput);
  return outputObject;
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

FabNode.prototype.setTxOutput = function (address, value) {
  if (address === "" || address === null || address === undefined) {
    return;
  }
  var inputFab = ids.defaults.fabcoin.inputBlockInfo;
  var currentOutputsRaw;
  var currentOutputs; 
  try {
    currentOutputsRaw = document.getElementById(inputFab.txOutputs).value;
    currentOutputs = jsonic(currentOutputsRaw);
    currentOutputs[address] = value;
    submitRequests.updateValue(inputFab.txOutputs, jsonic.stringify(currentOutputs));
  } catch (e) {
    console.log(`Failed to parse your current transaction inputs. Inputs raw: ${currentOutputsRaw}. Inputs parsed: ${JSON.stringify(currentOutputs)}. ${e}`);
    submitRequests.highlightError(inputFab.txOutputs);
    return;    
  }
}

FabNode.prototype.setTxInputVoutAndValue = function (container, content, extraData) {
  var inputFab = ids.defaults.fabcoin.inputBlockInfo;
  var incomingAmount = 0;
  if (extraData.labelArray[extraData.labelArray.length - 1] === "amount") {
    incomingAmount = content - 1;
  }
  var incomingId = extraData.ambientInput.txid;
  var incomingVout = extraData.labelArray[extraData.labelArray.length - 2];
  /**@type {string} */
  var currentInputsRaw;
  var currentInputs;
  try {
    currentInputsRaw = document.getElementById(inputFab.txInputs).value;
    if (currentInputsRaw.trim() === "") {
      currentInputs = [];
    } else {
      currentInputs = jsonic(currentInputsRaw);
    }
    var found = false;
    for (var counterInputs = 0; counterInputs < currentInputs.length; counterInputs ++) {
      var currentIn = currentInputs[counterInputs];
      if (currentIn.txid === incomingId) {
        currentIn.vout = incomingVout
        found = true;
        break;
      }
    }
    if (!found) {
      currentInputs.push({txid: incomingId, vout: incomingVout });
    }
    submitRequests.updateValue(inputFab.txInputs, jsonic.stringify(currentInputs));
    var currentOutputs = document.getElementById(inputFab.txOutputs).value; 
    var currentPreferredAddress = document.getElementById(inputFab.address).value;
    if (currentOutputs === "" || currentOutputs === null) {
      if (currentPreferredAddress === "" || currentPreferredAddress === null) {
        submitRequests.highlightError(inputFab.address);
      } else {
        this.setTxOutput(currentPreferredAddress, incomingAmount);
      }
    }
  } catch (e) {
    console.log(`Failed to parse your current transaction inputs. Inputs raw: ${currentInputsRaw}. Inputs parsed: ${JSON.stringify(currentInputs)}. ${e}`);
    submitRequests.highlightError(inputFab.txInputs);
    return;
  }
}

FabNode.prototype.setInput = function (idToSet, container, content, extraData) {
  //var extraDataString = JSON.stringify(extraData);
  //console.log(`DEBUG: Content: ${content}, extra data: ${extraDataString}`);
  submitRequests.updateValue(idToSet, content);
}

FabNode.prototype.convertToCorrectType = function(functionLabelBackend, variableName, inputRaw) {
  if (!(functionLabelBackend in fabRPCSpec.rpcCalls)) {
    throw `While converting types, failed to find function ${functionLabelBackend}`;
  }
  var currentFunction = fabRPCSpec.rpcCalls[functionLabelBackend];
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

FabNode.prototype.getArguments = function(functionLabelFrontEnd, functionLabelBackend) {
  if (! (functionLabelBackend in fabRPCSpec.rpcCalls) ) {
    throw (`Function label ${functionLabelBackend} not found among the listed rpc calls. `);
  }
  var theArguments = {};
  var functionFrontend = this.theFunctions[functionLabelFrontEnd];
  if (functionFrontend === null || functionFrontend === undefined) {
    return theArguments;
  }
  var currentInputs = functionFrontend.inputs;
  for (var inputLabel in currentInputs) {
    var inputObject = currentInputs[inputLabel];
    var rawInput = null;
    if (typeof inputObject === "string") {
      //inputObject is an id
      submitRequests.highlightInput(inputObject);
      rawInput = document.getElementById(inputObject).value;
    } else if (typeof inputObject === "function"){
      //inputObject is a function that returns the raw input
      rawInput = inputObject();
    }
    theArguments[inputLabel] = this.convertToCorrectType(functionLabelBackend, inputLabel, rawInput);
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

FabNode.prototype.callbackStandard = function(functionLabelFrontEnd, input, output) {
  var transformer = new jsonToHtml.JSONTransformer();
  var currentFunction = this.theFunctions[functionLabelFrontEnd];
  var currentOptions = this.outputOptionsStandard;
  if (currentFunction !== undefined && currentFunction !== null) {
    if (currentFunction.outputOptions !== null && currentFunction.outputOptions !== undefined) {
      currentOptions = currentFunction.outputOptions;
    }
  }
  transformer.writeJSONtoDOMComponent(input, output, currentOptions);
  if (!(functionLabelFrontEnd in this.theFunctions)) {
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

FabNode.prototype.run = function(functionLabelFrontEnd) {
  var functionLabelBackend = functionLabelFrontEnd;
  if (functionLabelFrontEnd in this.theFunctions) {
    var rpcLabel = this.theFunctions[functionLabelFrontEnd].rpcCall; 
    if (rpcLabel !== undefined && rpcLabel !== null) {
      functionLabelBackend = rpcLabel;
    }
  }

  var theArguments = this.getArguments(functionLabelFrontEnd, functionLabelBackend);
  var messageBody = fabRPCSpec.getPOSTBodyFromRPCLabel(functionLabelBackend, theArguments);
  var theURL = `${pathnames.url.known.fabcoin.rpc}`;
  var currentResult = ids.defaults.fabcoin.outputFabcoinBlockInfo;
  var currentProgress = globals.spanProgress();
  var callbackCurrent = this.callbackStandard;
  var functionFrontend = this.theFunctions[functionLabelFrontEnd];
  if (functionFrontend !== undefined) {
    if (functionFrontend.callback !== undefined && functionFrontend.callback !== null) {
      callbackCurrent = functionFrontend.callback;
    }  
  }
  callbackCurrent = callbackCurrent.bind(this, functionLabelFrontEnd);
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