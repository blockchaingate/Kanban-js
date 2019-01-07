"use strict";
const fabRPCSpec = require('../../external_connections/fabcoin/rpc');
const fabInitializationSpec = require('../../external_connections/fabcoin/initialization');
const pathnames = require('../../pathnames');
const ids = require('../ids_dom_elements');
const globals = require('../globals');
const submitRequests = require('../submit_requests');
const jsonToHtml = require('../json_to_html');
const miscellaneousBackend = require('../../miscellaneous');
const miscellaneousFrontEnd = require('../miscellaneous_frontend');
//const jsonic = require('jsonic');
const cryptoKanban = require('../../crypto/crypto_kanban');
const encodingsKanban = require('../../crypto/encodings');
const fabcoinInitializationFrontend = require('./initialization');

function FabNode() {
  var inputFabBlock = ids.defaults.fabcoin.inputBlockInfo;
  var inputKBGOInitialization = ids.defaults.kanbanGO.inputInitialization;
  var inputFabCryptoSchnorr = ids.defaults.fabcoin.inputCrypto.inputSchnorrSignature;
  var inputFabCryptoAggregate = ids.defaults.fabcoin.inputCrypto.inputAggregateSignature;
  //var initializer = fabcoinInitializationFrontend.initializer;
  this.transformersStandard = {
    blockHash: this.getSetInputAndRunWithShortener(inputFabBlock.blockHash, "getBlockByHash", "Sets the block hash field &amp; and fetches the block info. "),
    shortener: {
      transformer: miscellaneousBackend.hexShortener4Chars
    },
    extremeShortener: {
      transformer: miscellaneousBackend.hexVeryShortDisplay
    },
    transactionId: this.getSetInputAndRunWithShortener(inputFabBlock.txid, "getTransactionById", "Sets the transaction id field, fetches and decodes the transaction. "),
    transactionHexDecoder: this.getSetInputAndRunWithShortener(inputFabBlock.txHex, "decodeTransactionRaw", "Sets the transaction hex field and decodes the tx."),
    setAddress: this.getSetInputWithShortener(inputFabBlock.address),
    setPrivateKey: {
      clickHandler: this.setPrivateKeyComputeAllElse.bind(this),
      transformer: miscellaneousBackend.hexShortener4Chars,
    },
    setPrivateKeySchnorr: this.getSetInputWithShortener(inputFabCryptoSchnorr.privateKey),
    setNonceSchnorr: this.getSetInputWithShortener(inputFabCryptoSchnorr.nonce),
    setPublicKeySchnorr: this.getSetInputAndRunWithShortener(inputFabCryptoSchnorr.publicKey),
    setTxInputVoutAndValue: {
      clickHandler: this.setTxInputVoutAndValue.bind(this),
      tooltip: "Sets the tx inputs to this vout. Sets the transfer amount to the value of this txout minus 1."
    },
    setTxInputVoutNoValue: {
      clickHandler: this.setTxInputVoutAndValue.bind(this),
      tooltip: "Sets the tx inputs to this vout. Sets the transfer amount to 0. "
    },
    setContractId: {
      clickHandler: this.setContractId.bind(this),
      transformer: miscellaneousBackend.hexShortener4Chars
    },
    setSchnorrSignature: this.getSetInputWithShortener(inputFabCryptoSchnorr.signature),
    setAggregateSignature: this.getSetInputWithShortener(inputFabCryptoAggregate.theAggregation),
    setAggregateSignatureUncompressed: this.getSetInputWithShortener(inputFabCryptoAggregate.aggregateSignatureUncompressed),
    setAggregateSignatureComplete: this.getSetInputWithShortener(inputFabCryptoAggregate.aggregateSignatureComplete),
  };

  this.optionsStandard = {
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
      "details.${number}.vout": this.transformersStandard.setTxInputVoutNoValue,
    },
  };
  this.optionsTransaction = {
    transformers: {
      hash: this.transformersStandard.transactionId,
      blockhash: this.transformersStandard.blockHash,
      txid: this.transformersStandard.transactionId,
      "details.${number}.address": this.transformersStandard.setAddress,
      "vout.${number}.scriptPubKey.addresses.${number}": this.transformersStandard.setAddress,
      "vout.${number}.n": this.transformersStandard.setTxInputVoutNoValue,
      "vout.${number}.value": this.transformersStandard.setTxInputVoutAndValue,
      "vout.${number}.scriptPubKey.asm": this.transformersStandard.shortener,
      "vout.${number}.scriptPubKey.hex": this.transformersStandard.shortener,
      hex: this.transformersStandard.transactionHexDecoder,
      inputRawTransaction: this.transformersStandard.transactionHexDecoder,
      inputTransactionDecodedAndRecoded: this.transformersStandard.transactionHexDecoder,
      "vin.${number}.txid": this.transformersStandard.transactionId,
      "vin.${number}.scriptSig.asm": this.transformersStandard.shortener,
      "vin.${number}.scriptSig.hex": this.transformersStandard.shortener,
      comments: this.transformersStandard.shortener,
    }
  };
  this.optionsContract = {
    transformers: {
      address: this.transformersStandard.setContractId,
      hash160: this.transformersStandard.extremeShortener,
      txid: this.transformersStandard.transactionId,
      sender: this.transformersStandard.setAddress,
      "transactionReceipt.bloom": this.transformersStandard.shortener,
      "transactionReceipt.stateRoot": this.transformersStandard.shortener,
      "executionResult.newAddress": this.transformersStandard.shortener,
      "executionResult.output": this.transformersStandard.shortener,
    }
  };
  this.optionsCrypto = {
    transformers: {
      "keccak_256": this.transformersStandard.shortener,
      "sha3_256": this.transformersStandard.shortener,
      privateKeyBase58Check: this.transformersStandard.setPrivateKeySchnorr,
      privateKeyBase58WithoutCheck: this.transformersStandard.setPrivateKeySchnorr,
      privateKeyHex: this.transformersStandard.setPrivateKeySchnorr,
      secretHex: this.transformersStandard.setPrivateKeySchnorr,
      "input.${number}": this.transformersStandard.shortener,
      publicKeyHexCompressed: this.transformersStandard.setPublicKeySchnorr,
      challengeHex: this.transformersStandard.shortener,
      nonceSchnorrBase58Check: this.transformersStandard.shortener,
      signatureSchnorrBase58Check: this.transformersStandard.shortener,
      signatureSchnorrBase58: this.transformersStandard.setSchnorrSignature,
      signature: this.transformersStandard.setSchnorrSignature,
      signatureBase58: this.transformersStandard.setSchnorrSignature,
      signatureBase58Check: this.transformersStandard.setSchnorrSignature,
      solutionBase58Check: this.transformersStandard.shortener,
      publicKeyHex: this.transformersStandard.setPublicKeySchnorr,
      "privateKeys.${number}": this.transformersStandard.setPrivateKeySchnorr,
      "aggregator.publicKeys.${number}": this.transformersStandard.setPublicKeySchnorr,
      "aggregator.commitments.${number}": this.transformersStandard.shortener,
      "aggregator.aggregatePublicKey": this.transformersStandard.shortener,
      "aggregator.aggregateCommitment": this.transformersStandard.shortener,
      "aggregator.messageDigest": this.transformersStandard.shortener,
      "aggregator.aggregateSolution": this.transformersStandard.shortener,
      "aggregator.aggregateCommitmentFromSignature": this.transformersStandard.shortener,
      "aggregator.signatureNoBitmap": this.transformersStandard.setAggregateSignature,
      "aggregator.signatureUncompressed": this.transformersStandard.setAggregateSignatureUncompressed,
      "aggregator.signatureComplete": this.transformersStandard.setAggregateSignatureComplete,
      "aggregator.lockingCoefficients.${number}": this.transformersStandard.shortener,
      "signers.${number}.myPublicKey": this.transformersStandard.setPublicKeySchnorr,
      "signers.${number}.privateKeyBase58": this.transformersStandard.setPrivateKeySchnorr,
      "signers.${number}.myNonceBase58": this.transformersStandard.setNonceSchnorr,
      "signers.${number}.myLockingCoefficient": this.transformersStandard.shortener,
      "signers.${number}.mySolution": this.transformersStandard.shortener,
      "signers.${number}.commitmentHexCompressed": this.transformersStandard.shortener,
      "verifier.lockingCoefficients.${number}": this.transformersStandard.shortener,
      "verifier.concatenatedPublicKeys": this.transformersStandard.shortener,
      "verifier.messageDigest": this.transformersStandard.shortener,
      "verifier.aggregatePublicKey": this.transformersStandard.shortener,
      "verifier.publicKeys.${number}": this.transformersStandard.shortener,
      "verifier.aggregateSolution": this.transformersStandard.shortener,
      "verifier.aggregateCommitment": this.transformersStandard.shortener,
      "verifier.aggregateCommitmentFromSignature": this.transformersStandard.shortener,
      "verifier.signatureNoBitmap": this.transformersStandard.setAggregateSignature,
      reason: this.transformersStandard.shortener,
    },
  };
  this.optionsInitialization = {
    totalEntriesToDisplayAtEnds: 1000,
    transformers: {
      resultHTML: this.transformersStandard.shortener,
       
    }
  };
  /**@type {Object.<string,{outputJSONDefault: string, outputOptionsDefault: string}>} */
  this.callTypes = {
    crypto: {
      outputJSONDefault: ids.defaults.fabcoin.outputFabcoinCrypto,
      outputOptionsDefault: this.optionsCrypto,
    },
    initialization: {
      outputJSONDefault: ids.defaults.fabcoin.outputFabcoinInitialization,
      outputOptionsDefault: this.optionsInitialization,
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
      outputOptions: this.optionsTransaction,
    },
    decodeTransactionRaw: {
      inputs: {
        hexString: inputFabBlock.txHex
      },
      outputOptions: this.optionsTransaction,
    },
    dumpPrivateKey: {
      inputs: {
        address: inputFabBlock.address
      },
      outputOptions: {
        transformers: {
          singleEntry: this.transformersStandard.setPrivateKey
        }
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
      outputOptions: this.optionsTransaction,
    },
    sendRawTransaction: {
      inputs: {
        rawTransactionHex: inputFabBlock.txHex
      },
      outputOptions: this.optionsTransaction,
    },
    insertAggregateSignature: {
      inputs: {
        rawTransaction: inputFabBlock.txHex,
        aggregateSignature: inputFabBlock.txAggregateSignature,
      },
      outputOptions: this.optionsTransaction,
    },
    getRawMempool: {
      outputOptions: {
        transformers: {
          "${number}" : this.transformersStandard.transactionId,
        }
      }
    },
    createContract: {
      inputs: {
        contractHex: inputFabBlock.contractHex,
      },
      outputs: {
        address: [
          inputFabBlock.contractId, 
          inputKBGOInitialization.contractId, 
          ids.defaults.kanbanGO.inputSendReceive.contractId,
          ids.defaults.fabcoin.inputInitialization.smartContractId,
        ],
      },
      outputOptions: this.optionsContract,
    },
    callContract: {
      inputs: {
        contractId: inputFabBlock.contractId,
        data: inputFabBlock.contractData,
      },
      outputOptions: this.optionsContract,
    },
    sendToContract: {
      inputs: {
        contractId: inputFabBlock.contractId,
        data: inputFabBlock.contractData,
        amount: inputFabBlock.txBeneficiaryAmounts,
        gasLimit: inputFabBlock.gasLimit,
        gasPrice: inputFabBlock.gasPrice,
        senderAddress: inputFabBlock.address
      },
      outputOptions: this.optionsContract,
    },
    listContracts: {
      outputOptions: {
        layoutObjectAsArray: true,
        transformers: {
          "_rowLabel" : this.transformersStandard.setContractId,
        }
      }
    },
    getNewAddress: {
      outputOptions: {
        transformers: {
          singleEntry: this.transformersStandard.setAddress,
        }
      }
    },
    testSha3: {
      inputsBase64: {
        message: inputFabCryptoSchnorr.messageToSha3,
      },
      callType: this.callTypes.crypto,
    },
    testPrivateKeyGeneration: {
      outputs: {
        privateKeyBase58Check: inputFabCryptoSchnorr.privateKey,
      },
      callType: this.callTypes.crypto,
    },
    testPublicKeyFromPrivate: {
      inputs: {
        privateKey: inputFabCryptoSchnorr.privateKey,
      },
      callType: this.callTypes.crypto,
      outputs: {
        publicKeyHexCompressed: inputFabCryptoSchnorr.publicKey,
      },
    },
    testSchnorrSignature: {
      inputs: {
        privateKey: inputFabCryptoSchnorr.privateKey,
        message: inputFabCryptoSchnorr.messageToSha3Hex,
      },
      outputs: {
        signatureBase58: inputFabCryptoSchnorr.signature
      },
      callType: this.callTypes.crypto,
    },
    testSchnorrSignatureVerify: {
      inputs: {
        signature: inputFabCryptoSchnorr.signature,
        publicKey: inputFabCryptoSchnorr.publicKey,
        message: inputFabCryptoSchnorr.messageToSha3Hex
      },
      callType: this.callTypes.crypto
    },
    testECDSASignature: {
      inputs: {
        privateKey: inputFabCryptoSchnorr.privateKey,
        messageHex: inputFabCryptoSchnorr.messageToSha3Hex
      },
      outputs: {
        signature: inputFabCryptoSchnorr.signature
      },
      callType: this.callTypes.crypto,
    },
    testECDSASignatureVerify: {
      inputs: {
        signature: inputFabCryptoSchnorr.signature,
        publicKey: inputFabCryptoSchnorr.publicKey,
        messageHex: inputFabCryptoSchnorr.messageToSha3Hex
      },
      callType: this.callTypes.crypto
    },
    testAggregateSignatureGeneratePrivateKeys: {
      inputs: {
        numberOfPrivateKeysToGenerate: inputFabCryptoAggregate.numberOfPrivateKeysToGenerate,
      },
      callType: this.callTypes.crypto,
      callback: this.callbackAggregateSignatureGeneratePrivateKeys
    },
    testAggregateSignatureInitialize: {
      inputs: {
        privateKeys: inputFabCryptoAggregate.privateKeys,
      },
      callType: this.callTypes.crypto,
      callback: this.callbackAggregateSignatureInitialize
    },
    testAggregateSignatureCommitment: {
      inputs: {
        messageHex: inputFabCryptoAggregate.messageHex
      },
      callType: this.callTypes.crypto,
      callback: this.callbackAggregateSignatureCommit
    },
    testAggregateSignatureChallenge: {
      inputs: {
        committedSignersBitmap: inputFabCryptoAggregate.committedSignersBitmap,
        commitments: inputFabCryptoAggregate.commitments
      },
      outputs: {
        aggregator: {
          aggregateCommitment: inputFabCryptoAggregate.aggregateCommitment,
          aggregatePublicKey: inputFabCryptoAggregate.aggregatePubkey,
          messageDigest: inputFabCryptoAggregate.messageDigest,
        },
      },
      callType: this.callTypes.crypto,
    },
    testAggregateSignatureSolutions: {
      inputs: {
        committedSignersBitmap: inputFabCryptoAggregate.committedSignersBitmap,
        messageDigest: inputFabCryptoAggregate.messageDigest,
        aggregateCommitment: inputFabCryptoAggregate.aggregateCommitment, 
        aggregatePublicKey: inputFabCryptoAggregate.aggregatePubkey,
      },
      callback: this.callbackAggregateSignatureSolutions,
      callType: this.callTypes.crypto,
    },
    testAggregateSignatureAggregation: {
      inputs: {
        solutions: inputFabCryptoAggregate.solutions,
      },
      outputs: {
        aggregator: {
          signatureNoBitmap: inputFabCryptoAggregate.theAggregation,
          signatureComplete: inputFabCryptoAggregate.aggregateSignatureComplete,
          signatureUncompressed: [inputFabCryptoAggregate.aggregateSignatureUncompressed, inputFabBlock.txAggregateSignature]
        }
      },
      callType: this.callTypes.crypto,
    },
    testAggregateVerification: {
      inputs: {
        signature: inputFabCryptoAggregate.theAggregation,
        committedSignersBitmap: inputFabCryptoAggregate.committedSignersBitmap,
        publicKeys: inputFabCryptoAggregate.publicKeys,
        messageHex: inputFabCryptoAggregate.messageHex,
      },
      callType: this.callTypes.crypto,
    },
    testAggregateVerificationComplete: {
      inputs: {
        signatureComplete: inputFabCryptoAggregate.aggregateSignatureComplete,
        messageHex: inputFabCryptoAggregate.messageHex
      },
      callType: this.callTypes.crypto,
    },
    getLogFile: {
      callType: this.callTypes.initialization,
    },
    getPeerInfo: {
      callType: this.callTypes.initialization,
    }
  };

}

FabNode.prototype.getObjectFromInput = function(inputId) {
  var rawInput = document.getElementById(inputId).value;
  var outputObject = null;
  try {
    outputObject = JSON.parse(rawInput);
  } catch (e) {
    if (typeof rawInput === "string") {
      outputObject = rawInput;
    } else {
      outputObject = {};
    }
  }
  return outputObject;
}

FabNode.prototype.combineClickHandlers = function(
  /**@type {function[]}*/ functionArray, 
  container, 
  content, 
  extraData
) {
  for (var counterFunction = 0; counterFunction < functionArray.length; counterFunction ++) {
    functionArray[counterFunction](container, content);
  }
}

FabNode.prototype.getSetInputAndRunWithShortener = function(idOutput, functionLabelToFun, tooltip) {
  var setter = this.setInput.bind(this, idOutput);
  var runner = this.run.bind(this, functionLabelToFun);
  return {
    clickHandler: this.combineClickHandlers.bind(this, [setter, runner]),
    transformer: miscellaneousBackend.hexShortener4Chars,
    tooltip: tooltip
  };  
}

FabNode.prototype.getSetInputNoShortener = function(idOutput) {
  return {
    clickHandler: this.setInput.bind(this, idOutput)
  };  
}

FabNode.prototype.getSetInputWithShortener = function(idOutput) {
  return {
    clickHandler: this.setInput.bind(this, idOutput),
    transformer: miscellaneousBackend.hexShortener4Chars
  };  
}

FabNode.prototype.computeTxInsAndOuts = function(sourceIsFabPage) {
  var inputFab = ids.defaults.fabcoin.inputBlockInfo;
  var inputKB = ids.defaults.kanbanGO.inputSendReceive;
  var incomingIds;
  var incomingNOuts;
  var incomingOutAddresses;
  var incomingAmounts;
  var inputIdContainer;
  var incomingGasPrice;
  var incomingGasLimit;
  var smartContractId;
  var smartContractData;
  var otherIdContainer;
  var aggregatePubKeys;
  var currentCheckboxIds;
  var otherCheckboxIds;
  if (sourceIsFabPage) {
    inputIdContainer    = inputFab;
    otherIdContainer    = inputKB;
    currentCheckboxIds  = ids.defaults.fabcoin.checkboxes.transactions;
    otherCheckboxIds    = ids.defaults.kanbanGO.checkboxes.transactions;
  } else  {
    inputIdContainer    = inputKB;
    otherIdContainer    = inputFab;
    currentCheckboxIds  = ids.defaults.kanbanGO.checkboxes.transactions;
    otherCheckboxIds    = ids.defaults.fabcoin.checkboxes.transactions;
  }
  incomingIds = document.getElementById(inputIdContainer.txInIds).value;
  incomingNOuts = document.getElementById(inputIdContainer.txInNOuts).value;
  incomingOutAddresses = document.getElementById(inputIdContainer.txBeneficiaryAddresses).value;
  incomingAmounts = document.getElementById(inputIdContainer.txBeneficiaryAmounts).value;
  incomingGasPrice = document.getElementById(inputIdContainer.gasPrice).value;
  incomingGasLimit = document.getElementById(inputIdContainer.gasLimit).value;
  smartContractId = document.getElementById(inputIdContainer.contractId).value;
  smartContractData = document.getElementById(inputIdContainer.contractData).value;
  aggregatePubKeys = document.getElementById(inputFab.txAggregatePublicKeys).value;
  var secretInString = document.getElementById(inputIdContainer.secretIn).value;

  var smartContractInOutputs = document.getElementById(currentCheckboxIds.contractCallsInOutputs).checked;
  var fullSignatureInInputs = document.getElementById(currentCheckboxIds.fullSignatureInInputs).checked; 
  var usePayToPubkeyWithoutHash = document.getElementById(currentCheckboxIds.secretSignsPubkeyNoHash).checked;
  var doSendToContract = document.getElementById(currentCheckboxIds.sendToContract).checked;
  var incomingIdArray = miscellaneousBackend.splitMultipleDelimiters(incomingIds, ", \t");
  var incomingNOutArray = miscellaneousBackend.splitMultipleDelimiters(incomingNOuts, ", \t");
  var secretInArray = miscellaneousBackend.splitMultipleDelimiters(secretInString, ", \t");
  var resultIn = [];
  var counterSecret = 0;
  
  if (fullSignatureInInputs) {
    var contractObject = {
      txid: "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      vout: 0,
      secretIn: secretInArray[counterSecret],
      isPayToPublicWithoutHash: usePayToPubkeyWithoutHash,
    };
    counterSecret ++;
    resultIn.push(contractObject)
  }
  var resultOut = {};
  for (var i = 0; i < incomingIdArray.length; i ++) {
    var incomingIn = {
      txid: incomingIdArray[i],
      vout: Number(incomingNOutArray[i]),
    };
    if (counterSecret < secretInArray.length) {
      incomingIn.secretIn = secretInArray[counterSecret];
      incomingIn.isPayToPublicWithoutHash = usePayToPubkeyWithoutHash;
      counterSecret ++;
    }
    resultIn.push(incomingIn);
  }
  var incomingOutAddressArray = miscellaneousBackend.splitMultipleDelimiters(incomingOutAddresses, ", \t");
  var incomingOutAmountArray = miscellaneousBackend.splitMultipleDelimiters(incomingAmounts, ", \t");

  var amountCounter = 0;
  if (aggregatePubKeys !== "" && typeof aggregatePubKeys === "string") {
    resultOut.aggregateSignature = {
      publicKeysHex: aggregatePubKeys,
      amount: Number(incomingOutAmountArray[amountCounter]),
    };
    amountCounter ++;
  }
  if (smartContractInOutputs) {
    resultOut.contract = {};
    resultOut.contract.contractAddress = smartContractId;
    resultOut.contract.data = smartContractData;
    resultOut.contract.coverFees = false;
    if (doSendToContract) {
      resultOut.contract.amount = Number(incomingOutAmountArray[amountCounter]);
      if (incomingGasLimit !== "" && incomingGasLimit !== null && incomingGasLimit !== undefined) {
        resultOut.contract.gasLimit = Number(incomingGasLimit);
      }
      if (incomingGasPrice !== "" && incomingGasPrice !== null && incomingGasPrice !== undefined) {
        resultOut.contract.gasPrice = incomingGasPrice;
      }
      amountCounter ++;
    } else {
      resultOut.contract.coverFees = true;
    } 
  }
  for (var i = 0; i < incomingOutAddressArray.length; i ++) {
    var incomingAmount = incomingOutAmountArray[amountCounter];
    if (incomingAmount === undefined) {
      console.log("Not enough amount values listed. ");
    }
    resultOut[incomingOutAddressArray[i]] = incomingAmount;
    amountCounter ++;
  }
  miscellaneousFrontEnd.updateValue(otherIdContainer.contractId, smartContractId);
  miscellaneousFrontEnd.updateValue(otherIdContainer.contractData, smartContractData);

  miscellaneousFrontEnd.updateValue(otherIdContainer.secretIn, secretInString);
  miscellaneousFrontEnd.updateValue(otherIdContainer.txInIds, incomingIds);
  miscellaneousFrontEnd.updateValue(otherIdContainer.txInNOuts, incomingNOuts);
  miscellaneousFrontEnd.updateValue(otherIdContainer.txBeneficiaryAddresses, incomingOutAddresses);
  miscellaneousFrontEnd.updateValue(otherIdContainer.txBeneficiaryAmounts, incomingAmounts);
  miscellaneousFrontEnd.updateValue(otherIdContainer.gasPrice, incomingGasPrice);
  miscellaneousFrontEnd.updateValue(otherIdContainer.gasLimit, incomingGasLimit);

  incomingIds = document.getElementById(inputIdContainer.txInIds).value;
  incomingNOuts = document.getElementById(inputIdContainer.txInNOuts).value;
  incomingOutAddresses = document.getElementById(inputIdContainer.txBeneficiaryAddresses).value;
  incomingAmounts = document.getElementById(inputIdContainer.txBeneficiaryAmounts).value;

  miscellaneousFrontEnd.updateValue(inputFab.txInputs, JSON.stringify(resultIn));
  miscellaneousFrontEnd.updateValue(inputFab.txOutputs, JSON.stringify(resultOut));
  miscellaneousFrontEnd.updateValue(inputKB.txInputs, JSON.stringify(resultIn));
  miscellaneousFrontEnd.updateValue(inputKB.txOutputs, JSON.stringify(resultOut));
  for (var label in currentCheckboxIds) {
    document.getElementById(otherCheckboxIds[label]).checked = document.getElementById(currentCheckboxIds[label]).checked;
  }
}

FabNode.prototype.setTxInputVoutAndValue = function(container, content, extraData) {
  var inputFab = ids.defaults.fabcoin.inputBlockInfo;
  var inputKanban = ids.defaults.kanbanGO.inputSendReceive;
  var incomingAmount = 0;
  var incomingFees = 0;
  if (extraData.labelArray[extraData.labelArray.length - 1] === "value") {
    incomingAmount = content - 1;
    incomingFees = 1;
  }
  var incomingId = extraData.ambientInput.txid;
  var incomingNOut = extraData.labelArray[extraData.labelArray.length - 2];

  miscellaneousFrontEnd.updateValue(inputFab.txInIds, incomingId);
  miscellaneousFrontEnd.updateValue(inputFab.txInNOuts, incomingNOut);
  miscellaneousFrontEnd.updateValue(inputFab.txBeneficiaryAmounts, incomingAmount);
  miscellaneousFrontEnd.updateValue(inputFab.txFee, incomingFees);

  miscellaneousFrontEnd.updateValue(inputKanban.txInIds, incomingId);
  miscellaneousFrontEnd.updateValue(inputKanban.txInNOuts, incomingNOut);
  miscellaneousFrontEnd.updateValue(inputKanban.txBeneficiaryAmounts, incomingAmount);
  miscellaneousFrontEnd.updateValue(inputKanban.txFee, incomingFees);
  this.computeTxInsAndOuts(true);
}

FabNode.prototype.setContractId = function(container, content, extraData) {
  //var extraDataString = JSON.stringify(extraData);
  //console.log(`DEBUG: Content: ${content}, extra data: ${extraDataString}`);
  miscellaneousFrontEnd.updateValue(ids.defaults.fabcoin.inputBlockInfo.contractId, content);
  miscellaneousFrontEnd.updateValue(ids.defaults.kanbanGO.inputInitialization.contractId, content);
  miscellaneousFrontEnd.updateValue(ids.defaults.fabcoin.inputInitialization.smartContractId, content)
}

FabNode.prototype.setInput = function(idToSet, container, content, extraData) {
  //var extraDataString = JSON.stringify(extraData);
  //console.log(`DEBUG: Content: ${content}, extra data: ${extraDataString}`);
  miscellaneousFrontEnd.updateValue(idToSet, content);
}

FabNode.prototype.computePublicKeyFromPrivate = function() {
  miscellaneousFrontEnd.highlightInput(ids.defaults.fabcoin.inputBlockInfo.privateKey);
  this.setPrivateKeyComputeAllElse(null, document.getElementById(ids.defaults.fabcoin.inputBlockInfo.privateKey).value);
}

FabNode.prototype.setPrivateKeyComputeAllElse = function(container, content, extraData) {
  var thePrivateKey = new cryptoKanban.CurveExponent();
  thePrivateKey.fromArbitrary(content);
  var thePublicKey = thePrivateKey.getExponent();
  miscellaneousFrontEnd.updateValue(ids.defaults.fabcoin.inputBlockInfo.publicKey, thePublicKey.toHex());
  var addressEthereumHex = thePublicKey.computeEthereumAddressHex();
  var addressFabTestnetBytes = thePublicKey.computeFABAddressTestnetBytes();
  var addressFabTestnetBase58 =  encodingsKanban.encodingDefault.toBase58Check(addressFabTestnetBytes);

  var addressFabMainnetBytes = thePublicKey.computeFABAddressBytes();
  var addressFabMainnetBase58 =  encodingsKanban.encodingDefault.toBase58Check(addressFabMainnetBytes);
  miscellaneousFrontEnd.updateValue(ids.defaults.fabcoin.inputBlockInfo.address, addressFabTestnetBase58);
  miscellaneousFrontEnd.updateValue(ids.defaults.fabcoin.inputBlockInfo.addressMainnet, addressFabMainnetBase58);
  miscellaneousFrontEnd.updateValue(ids.defaults.fabcoin.inputBlockInfo.addressEthereum, addressEthereumHex);

  console.log(`DEBUG: private key hex: ${thePrivateKey.toHex()}`);
  console.log(`DEBUG: content: ${JSON.stringify(content)}`);
}

FabNode.prototype.testAggregateSignatureClear = function() {
  var inputAggregate = ids.defaults.fabcoin.inputCrypto.inputAggregateSignature;
  miscellaneousFrontEnd.updateInnerHtml(inputAggregate.numberOfPrivateKeysToGenerate, "5");
  miscellaneousFrontEnd.updateInnerHtml(inputAggregate.privateKeys, "");
  miscellaneousFrontEnd.updateInnerHtml(inputAggregate.nonces, "");
  miscellaneousFrontEnd.updateInnerHtml(inputAggregate.publicKeys, "");
  miscellaneousFrontEnd.updateInnerHtml(inputAggregate.commitments, "");
  miscellaneousFrontEnd.updateInnerHtml(inputAggregate.committedSignersBitmap, "11111");
  miscellaneousFrontEnd.updateInnerHtml(inputAggregate.aggregatePubkey, "");
  miscellaneousFrontEnd.updateInnerHtml(inputAggregate.messageDigest, "");
  miscellaneousFrontEnd.updateInnerHtml(inputAggregate.theAggregation, "");
  miscellaneousFrontEnd.updateInnerHtml(inputAggregate.solutions, "");
  miscellaneousFrontEnd.updateInnerHtml(inputAggregate.aggregateCommitment, "");
  this.run(fabRPCSpec.rpcCalls.testAggregateSignatureGeneratePrivateKeys.rpcCall);
}

FabNode.prototype.callbackAggregateSignatureGeneratePrivateKeys = function(functionLabelFrontEnd, input, output) {
  this.callbackStandard(functionLabelFrontEnd, input, output);
  var inputParsed = JSON.parse(input);
  var privateKeys = [];
  for (var counterKeyPairs = 0; counterKeyPairs < inputParsed.privateKeys.length; counterKeyPairs ++) {
    privateKeys.push(inputParsed.privateKeys[counterKeyPairs]);
  }
  var aggregateIds = ids.defaults.fabcoin.inputCrypto.inputAggregateSignature;
  miscellaneousFrontEnd.updateValue(aggregateIds.privateKeys, privateKeys.join(", "));
}

FabNode.prototype.callbackAggregateSignatureInitialize = function(functionLabelFrontEnd, input, output) {
  this.callbackStandard(functionLabelFrontEnd, input, output);
  var inputParsed = JSON.parse(input);
  var publicKeys = [];
  var privateKeys = [];
  for (var counterKeyPairs = 0; counterKeyPairs < inputParsed.signers.length; counterKeyPairs ++) {
    publicKeys.push(inputParsed.signers[counterKeyPairs].myPublicKey);
    privateKeys.push(inputParsed.signers[counterKeyPairs].privateKeyBase58);
  }
  var aggregateIds = ids.defaults.fabcoin.inputCrypto.inputAggregateSignature;
  miscellaneousFrontEnd.updateValue(aggregateIds.publicKeys, publicKeys.join(", "));
  miscellaneousFrontEnd.updateValue(aggregateIds.privateKeys, privateKeys.join(", "));
  var publicKeysJoined = `["${publicKeys.join('","')}"]`; 
  miscellaneousFrontEnd.updateValue(ids.defaults.fabcoin.inputBlockInfo.txAggregatePublicKeys, publicKeysJoined);
}

FabNode.prototype.callbackAggregateSignatureCommit = function(functionLabelFrontEnd, input, output) {
  this.callbackStandard(functionLabelFrontEnd, input, output);
  var inputParsed = JSON.parse(input);
  var nonces = [];
  var commitments = [];
  for (var counterKeyPairs = 0; counterKeyPairs < inputParsed.signers.length; counterKeyPairs ++) {
    var currentSigner = inputParsed.signers[counterKeyPairs]; 
    nonces.push(currentSigner.myNonceBase58);
    commitments.push(currentSigner.commitmentHexCompressed);
  }
  var aggregateIds = ids.defaults.fabcoin.inputCrypto.inputAggregateSignature;
  miscellaneousFrontEnd.updateValue(aggregateIds.nonces, nonces.join(", "));
  miscellaneousFrontEnd.updateValue(aggregateIds.commitments, commitments.join(", "));
}

FabNode.prototype.callbackAggregateSignatureSolutions = function(functionLabelFrontEnd, input, output) {
  this.callbackStandard(functionLabelFrontEnd, input, output);
  var inputParsed = JSON.parse(input);
  var solutions = [];
  for (var counterKeyPairs = 0; counterKeyPairs < inputParsed.signers.length; counterKeyPairs ++) {
    var currentSigner = inputParsed.signers[counterKeyPairs]; 
    solutions.push(currentSigner.mySolution);
  }
  miscellaneousFrontEnd.updateValue(ids.defaults.fabcoin.inputCrypto.inputAggregateSignature.solutions, solutions.join(", "));
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
      miscellaneousFrontEnd.highlightInput(inputObject);
      rawInput = document.getElementById(inputObject).value;
    } else if (typeof inputObject === "function"){
      //inputObject is a function that returns the raw input
      rawInput = inputObject();
    }
    if (rawInput === null || rawInput === undefined || rawInput === "") {
      continue;
    }
    theArguments[inputLabel] = this.convertToCorrectType(functionLabelBackend, inputLabel, rawInput);
  }
  var currentInputsBase64 = functionFrontend.inputsBase64;
  if (currentInputsBase64 !== null && currentInputsBase64 !== undefined) {
    for (var inputLabel in currentInputsBase64) {
      var theValue =  document.getElementById(currentInputsBase64[inputLabel]).value;
      miscellaneousFrontEnd.highlightInput(currentInputsBase64[inputLabel]);
      theArguments[inputLabel] = Buffer.from(theValue).toString('base64');
    }
  }
  return theArguments;
}

FabNode.prototype.callbackAutoStartFabcoind = function(outputComponent, input, output) {
  if (typeof outputComponent === "string") {
    outputComponent = document.getElementById(outputComponent);
  }
  var transformer = new jsonToHtml.JSONTransformer();
  var extraHTML = transformer.getHtmlFromArrayOfObjects(input, this.optionsStandard);
  outputComponent.innerHTML += `<br>${extraHTML}`;
  transformer.bindButtons();
}

FabNode.prototype.callbackStandard = function(functionLabelFrontEnd, input, output, optionsOverrideDefault) {
  //console.log(`DEBUG: Call back standard here. Input: ${input}. Fun label: ${functionLabelFrontEnd}, output: ${output}`);
  var transformer = new jsonToHtml.JSONTransformer();
  var currentFunction = null;
  if (typeof functionLabelFrontEnd  === "string") {
    currentFunction = this.theFunctions[functionLabelFrontEnd];
  } else if (typeof functionLabelFrontEnd === "object"){
    currentFunction = functionLabelFrontEnd;
  }
  var currentOptions = this.optionsStandard;
  if (optionsOverrideDefault !== null && optionsOverrideDefault !== undefined) {
    currentOptions = optionsOverrideDefault
  }
  var currentOutputs = null;
  if (currentFunction !== undefined && currentFunction !== null) {
    if (currentFunction.outputOptions !== null && currentFunction.outputOptions !== undefined) {
      currentOptions = currentFunction.outputOptions;
    } else {
      if (currentFunction.callType !== null && currentFunction.callType !== undefined) {
        currentOptions = currentFunction.callType.outputOptionsDefault;
      }
    }
    currentOutputs = currentFunction.outputs;
  }
  if (typeof output === "string") {
    output = document.getElementById(output);
  }
  var resultHTML = transformer.getHtmlFromArrayOfObjects(input, currentOptions);
  var triggerFabcoindStart = false;
  try {
    var inputParsed = JSON.parse(input);

    if (typeof currentOutputs === "string") {
      miscellaneousFrontEnd.updateValue(currentOutputs, miscellaneousBackend.removeQuotes(input));
    }
    if (typeof currentOutputs === "object") {
      miscellaneousFrontEnd.updateFieldsRecursively(inputParsed, currentOutputs);
    } 
    if (inputParsed.resultHTML !== undefined && inputParsed.resultHTML !== undefined) {
      resultHTML = inputParsed.resultHTML + "<br>" + resultHTML;
    }
    if (inputParsed.error !== undefined && inputParsed.error !== null) {
      var errorMessage = inputParsed.error;
      if (typeof errorMessage === "object") {
        var errorTransformer = new jsonToHtml.JSONTransformer(); 
        errorMessage = errorTransformer.getHtmlFromArrayOfObjects(errorMessage, {flagDontShowRawButton: true, flagDontShowClearButton: true});
      }
      resultHTML = `<b style= 'color:red'>Error:</b> ${errorMessage}<br>` + resultHTML;
      if (inputParsed.error === fabInitializationSpec.urlStrings.errorFabNeverStarted) {
        triggerFabcoindStart = true;
        resultHTML += "<b style='color:green'> Will start fabcoind for you. </b><br>"
        resultHTML += "Equivalent to pressing the start fabcoind button. <br>";
      }
    }
    output.innerHTML = resultHTML;
    transformer.bindButtons();
  } catch (e) {
    throw(`Fatal error parsing: ${input}. ${e}`);
  }
  if (triggerFabcoindStart) {
    var initializer = fabcoinInitializationFrontend.initializer;
    var callbackExtra = this.callbackAutoStartFabcoind.bind(this, output);
    var callStartFabcoind = initializer.run.bind(initializer, 'runFabcoind', callbackExtra);
    setTimeout(callStartFabcoind, 0);
  }
}

FabNode.prototype.run = function(functionLabelFrontEnd, options) {
  var functionLabelBackend = functionLabelFrontEnd;
  if (functionLabelFrontEnd in this.theFunctions) {
    var rpcLabel = this.theFunctions[functionLabelFrontEnd].rpcCall; 
    if (rpcLabel !== undefined && rpcLabel !== null) {
      functionLabelBackend = rpcLabel;
    }
  }

  var theArguments = this.getArguments(functionLabelFrontEnd, functionLabelBackend);
  var manualInputs = null;
  if (typeof options === "object") {
    if (options.manualInputs !== null && options.manualInputs !== undefined) {
      manualInputs = options.manualInputs;
    }
  }
  if (manualInputs !== null && manualInputs !== undefined) {
    theArguments = Object.assign(theArguments, manualInputs);
  }
  var queryParameters = fabRPCSpec.getPOSTBodyFromRPCLabel(functionLabelBackend, theArguments);
  var theURL = `${pathnames.url.known.fabcoin.rpc}`;
  var currentResult = null;

  var currentProgress = globals.spanProgress();
  var callbackCurrent = this.callbackStandard;
  var functionFrontend = this.theFunctions[functionLabelFrontEnd];
  if (functionFrontend !== undefined && functionFrontend !== null) {
    if (functionFrontend.callback !== undefined && functionFrontend.callback !== null) {
      callbackCurrent = functionFrontend.callback;
    }  
    if (functionFrontend.outputJSON !== undefined && functionFrontend.outputJSON !== null) {
      currentResult = functionFrontend.outputJSON;
    }
    if (currentResult === undefined || currentResult === null) {
      if (functionFrontend.callType !== null && functionFrontend.callType !== undefined) {
        currentResult = functionFrontend.callType.outputJSONDefault;
      }
    }
  }
  if (currentResult === undefined || currentResult === null) {
    currentResult = ids.defaults.fabcoin.outputFabcoinBlockInfo;
  }
  callbackCurrent = callbackCurrent.bind(this, functionLabelFrontEnd);
  var messageBody = `${fabRPCSpec.urlStrings.command}=${queryParameters}`;
  if (messageBody.length < 1000) {
      theURL += `?${messageBody}`;
      submitRequests.submitGET({
          url: theURL,
          progress: currentProgress,
          callback: callbackCurrent,
          result: currentResult
      });
  } else {
    submitRequests.submitPOST({
      url:  theURL,
      progress: currentProgress,
      callback: callbackCurrent,
      result: currentResult,
      messageBody: messageBody,
    });
  }
}

FabNode.prototype.handleSolidityInput = function () {
  //var solidityInput = document.getElementById(ids.defaults.fabcoin.inputBlockInfo.solidityInput).value;
  //console.log(solidityInput);
}

var fabNode = new FabNode();

module.exports = {
  fabNode
}
