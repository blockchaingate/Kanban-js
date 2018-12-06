"use strict";
const submitRequests = require('../submit_requests');
const pathnames = require('../../pathnames');

const ids = require('../ids_dom_elements');
//const Block = require('../bitcoinjs_src/block');
const kanbanGO = require('../../external_connections/kanbango/rpc');
const kanbanGOInitialization = require('../../external_connections/kanbango/initialization');
const miscellaneousBackend = require('../../miscellaneous');
const miscellaneousFrontEnd = require('../miscellaneous_frontend');
const PendingCall = require('./pending_calls').PendingCall;
const KanbanGONode = require('./pending_calls').KanbanGONode;
const cryptoKanbanHashes = require('../../crypto/hashes');

function KanbanGoNodes() {
  var inputSchnorr = ids.defaults.kanbanGO.inputSchnorr;
  var inputAggregate = ids.defaults.kanbanGO.inputAggregateSignature;
  var inputSendReceive = ids.defaults.kanbanGO.inputSendReceive;
  var inputInitialization = ids.defaults.kanbanGO.inputInitialization;
  /** @type {number}*/
  this.numberOfCalls = 0;
  /** @type {PendingCall[]}*/
  this.pendingCalls = {};
  /**@type {KanbanGONode[]} */
  this.nodes = [];
  /**@type {string} */
  this.selectedNode = "none";
  
  this.transformersStandard = {
    middleShortener: {
      transformer: miscellaneousBackend.hexShortener8Chars,
    },
    shortener: {
      transformer: miscellaneousBackend.hexShortener4Chars,
    },
    shortener16: {
      transformer: miscellaneousBackend.hexShortener16Chars,
    },
    veryShort: {
      transformer: miscellaneousBackend.hexVeryShortDisplay,
    },
    blockHash: {
      clickHandler: this.getBlockByHash.bind(this),
      transformer: miscellaneousBackend.hexShortener4Chars,
      tooltip: "Sets the block hash field &amp; and fetches the block info. "
    },
    contractHexSetter: {
      clickHandler: this.setContractHex.bind(this),
      transformer: miscellaneousBackend.hexShortener4Chars,
    },
    contractCallSetter: {
      clickHandler: this.setContractFunctionName.bind(this),
      transformer: miscellaneousBackend.hexShortener8Chars,
    },
    contractSourceSetter: {
      clickHandler: this.setInput.bind(this, ids.defaults.fabcoin.inputBlockInfo.solidityInput),
      transformer: miscellaneousBackend.hexVeryShortDisplay,
    },
    setPrivateKeySchnorr: this.getSetInputWithShortener(inputSchnorr.privateKey),
    setPublicKeySchnorr: this.getSetInputWithShortener(inputSchnorr.publicKey),
    setSignatureSchnorr: this.getSetInputWithShortener(inputSchnorr.signature),
    setAggregateSignatureNoBitmap: this.getSetInputWithShortener(inputAggregate.aggregateSignature),
    setAggregateSignatureUncompressed: this.getSetInputWithShortener(inputAggregate.aggregateSignatureUncompressed),
    setAggregateSignatureComplete: this.getSetInputWithShortener(inputAggregate.aggregateSignatureComplete),
    highlightErrorWords: {
      transformer: miscellaneousFrontEnd.highlightErrorWords
    }
  };
  // Specifies options for rpc kanban rpc output display.
  this.optionsKanbanGOStandard = {
    // Suppose we are displaying a nested JSON.
    // The list below specifies how to transform the value of 
    // each [modified selector key], value
    // pair nested within the JSON. 
    //
    // To define the [modified selector key], we first define the 
    // [selector key].
    //
    // For a simple object such as {a: 1, b: "x"}, 
    // the [selector key] is the same as the object key, i.e., 
    // the [selector key]'s in the object above are "a", "b".
    // For a nested object sich as {a: {b: 1, c: 2}, d: "x", q: ["z", {e: "w"} ] },
    // the [selector key]'s are obtained by concatenating 
    // the labels recursively using a dot separator.
    // Here, each array is interpreted as an object
    // with a single key given by the string "${number}".
    // Rather than giving a fixed spec, we 
    // illustrate the whole procedure on an example. 
    // In the example {a: {b: 1, c: 2}, d: "x", q: ["z", {e: "w"} ] } above, 
    // there are 8 [sel. key], value pairs:
    // 
    // 1. [sel. key] = "a"     [value] = {b: 1, c: 2}
    // 2. [sel. key] = "a.b"   [value] = 1
    // 3. [sel. key] = "a.c"   [value] = 2
    // 4. [sel. key] = "d"     [value] = "x"
    // 5. [sel. key] = "q"     [value] = ["z", {e: "w"}]
    // 6. [sel. key] = "q.1"   [value] = "z"
    // 7. [sel. key] = "q.2"   [value] = {e: "w"}
    // 8. [sel. key] = "q.2.e" [value] = "w"
    //
    // Finally, we modify each selector key by replacing 
    // each number by the string  "${number}". 
    // In this way, the [selector key]s "q.1" and "q.2" are 
    // both replaced by "q.${number}" and "q.${number}".
    //
    // Please not that the modified selector keys do not distinguish between
    // array members with different indices.
    //
    // As an aside note, please note that if the keys of a json object contain dots, then
    // the modified selectors may end up selecting more than one label combination.
    // 
    transformers: {
      error: this.transformersStandard.shortener,
      address: this.transformersStandard.shortener,
      publicKey: this.transformersStandard.shortener,
      payload: this.transformersStandard.shortener,
      logsBloom: this.transformersStandard.veryShort,
      hash: this.transformersStandard.blockHash,
      miner: this.transformersStandard.shortener,
      mixHash: this.transformersStandard.veryShort,
      hashNoSignature: this.transformersStandard.shortener,
      parentHash: this.transformersStandard.blockHash,
      receiptsRoot: this.transformersStandard.veryShort,
      sha3Uncles: this.transformersStandard.shortener,
      signature: this.transformersStandard.shortener,
      nonce: this.transformersStandard.veryShort,
      stateRoot: this.transformersStandard.shortener,
      transactionsRoot: this.transformersStandard.shortener,
      "messages": this.transformersStandard.veryShort,
      "messages.received.${number}.payload": this.transformersStandard.shortener,
      "messages.received.${number}.from": this.transformersStandard.shortener,
      "messages.received.${number}.to": this.transformersStandard.shortener,
      "messages.sent.${number}.payload": this.transformersStandard.shortener,
      "messages.sent.${number}.from": this.transformersStandard.shortener,
      "messages.sent.${number}.to": this.transformersStandard.shortener,
      proposerAddress: this.transformersStandard.shortener,
      "view.blockHash": this.transformersStandard.shortener,
      "${any}.address": this.transformersStandard.shortener,
      "peerViews.${label}": this.transformersStandard.shortener,
      "peerViews.${any}.Digest": this.transformersStandard.shortener,
      "smallestMajorityView.Digest": this.transformersStandard.shortener,
      privateKeyBase58: this.transformersStandard.shortener,
      privateKeyBase58Check: this.transformersStandard.shortener,
      privateKeyBase64: this.transformersStandard.shortener,
      privateKeyHex: this.transformersStandard.shortener,
      ethereumAddressHex: this.transformersStandard.shortener,
      fabAddressMainnetBase58Check: this.transformersStandard.shortener,
      fabAddressMainnetHexNocheck: this.transformersStandard.shortener,
      fabAddressTestnetBase58Check: this.transformersStandard.shortener,
      fabAddressTestnetHexNocheck: this.transformersStandard.shortener,
      inputPrivateKeyBase58: this.transformersStandard.shortener,
      inputPrivateKeyBase58CheckRecoded: this.transformersStandard.shortener,
      inputPrivateKeyBase58Recoded: this.transformersStandard.shortener,
      inputPrivateKeyHex: this.transformersStandard.shortener,
      publicKeyHex: this.transformersStandard.shortener,
      publicKeyHexInternal: this.transformersStandard.shortener,
      "peers.${label}": this.transformersStandard.shortener,
    }
  };
  this.optionsForAddressDisplay = {
    layoutObjectAsArray: true,
    totalEntriesToDisplayAtEnds: 1000,
    transformers: {
      "_rowLabel" : this.transformersStandard.shortener,
      "address": this.transformersStandard.shortener,
      "mainChainBalance": {transformer: miscellaneousBackend.ensureMinCharWidth.bind(null, 17)},
    }
  };
  this.optionsKanbanGOLabelContraction = {};
  this.optionsKanbanGOLabelContraction.transformers = Object.assign({}, this.optionsKanbanGOStandard.transformers);
  this.optionsKanbanGOLabelContraction.transformers["${label}"] = this.transformersStandard.shortener;

  this.optionsInitialization = {
    totalEntriesToDisplayAtEnds: 30,
    transformers: {
      myEnodeAddress: this.transformersStandard.shortener16,
      "myConnections.${number}": this.transformersStandard.shortener16,
      "secretKey": this.transformersStandard.shortener,
      "binaries.${number}": this.transformersStandard.contractHexSetter,
      "contractNames.${number}": this.transformersStandard.contractHexSetter,
      "ABI.${number}.${number}.name": this.transformersStandard.contractCallSetter,
      "resultHTML": this.transformersStandard.shortener,
      "code": this.transformersStandard.contractSourceSetter,
      "contractInheritance.${label}": this.transformersStandard.shortener,
      "node.${number}": this.transformersStandard.shortener,
      "notes": this.transformersStandard.shortener,
      "${number}": this.transformersStandard.highlightErrorWords,
    }
  };
  this.optionsCrypto = {
    transformers: {
      resultKeccak: this.transformersStandard.shortener,
      resultSha3: this.transformersStandard.shortener,
      privateKeyBase58: this.transformersStandard.shortener,
      privateKeyBase58Check: this.transformersStandard.shortener,
      privateKeyBase64: this.transformersStandard.shortener,
      privateKeyHex: this.transformersStandard.shortener,
      ethereumAddressHex: this.transformersStandard.shortener,
      fabAddressMainnetBase58Check: this.transformersStandard.shortener,
      fabAddressMainnetHexNocheck: this.transformersStandard.shortener,
      fabAddressTestnetBase58Check: this.transformersStandard.shortener,
      fabAddressTestnetHexNocheck: this.transformersStandard.shortener,
      inputPrivateKeyBase58: this.transformersStandard.setPrivateKeySchnorr,
      inputPrivateKeyBase58CheckRecoded: this.transformersStandard.setPrivateKeySchnorr,
      inputPrivateKeyBase58Recoded: this.transformersStandard.setPrivateKeySchnorr,
      inputPrivateKeyHex: this.transformersStandard.setPrivateKeySchnorr,
      inputPrivateKeys: this.transformersStandard.shortener,
      publicKeyHex: this.transformersStandard.setPublicKeySchnorr,
      publicKeyHexInternal: this.transformersStandard.setPublicKeySchnorr,
      inputPublicKeyHex: this.transformersStandard.setPublicKeySchnorr,
      inputPublicKeyHexRecoded: this.transformersStandard.setPublicKeySchnorr,
      inputSignatureBase58: this.transformersStandard.setSignatureSchnorr,
      inputSignatureBase58Recoded: this.transformersStandard.setSignatureSchnorr,
      signatureBase58: this.transformersStandard.setSignatureSchnorr,
      inputSignature: this.transformersStandard.shortener,
      "privateKeys.${number}": this.transformersStandard.setPrivateKeySchnorr,
      "aggregator.publicKeys.${number}": this.transformersStandard.shortener,
      "aggregator.aggregateCommitment": this.transformersStandard.shortener,
      "aggregator.aggregatePublicKey": this.transformersStandard.shortener,
      "aggregator.commitments.${number}": this.transformersStandard.shortener,
      "aggregator.lockingCoefficients.${number}": this.transformersStandard.shortener,
      "aggregator.messageDigest": this.transformersStandard.shortener,
      "aggregator.aggregateSolution": this.transformersStandard.shortener,
      "aggregator.signatureNoBitmap": this.transformersStandard.setAggregateSignatureNoBitmap,
      "aggregator.signatureUncompressed": this.transformersStandard.setAggregateSignatureUncompressed,
      "aggregator.signatureComplete": this.transformersStandard.setAggregateSignatureComplete,

      "verifier.aggregateCommitment": this.transformersStandard.shortener,
      "verifier.aggregateSolution": this.transformersStandard.shortener,
      "verifier.aggregatePublicKey": this.transformersStandard.shortener,
      "verifier.concatenatedPublicKeys": this.transformersStandard.shortener,
      "verifier.lockingCoefficients.${number}": this.transformersStandard.shortener,
      "verifier.messageDigest": this.transformersStandard.shortener,
      "verifier.publicKeys.${number}": this.transformersStandard.shortener,
      "verifier.publicKeysJacobian.${number}": this.transformersStandard.shortener,
      "verifier.signatureNoBitmap": this.transformersStandard.shortener,
      "verifier.signatureUncompressed": this.transformersStandard.setAggregateSignatureUncompressed,
      "verifier.signatureComplete": this.transformersStandard.shortener,

      "signers.${number}.myPublicKey": this.transformersStandard.shortener,
      "signers.${number}.privateKeyBase58": this.transformersStandard.shortener,
      "signers.${number}.commitmentHexCompressed": this.transformersStandard.shortener,
      "signers.${number}.myNonceBase58": this.transformersStandard.shortener,
      "signers.${number}.myLockingCoefficient": this.transformersStandard.shortener,
      "signers.${number}.mySolution": this.transformersStandard.shortener,
      "inputPublicKeys.${number}": this.transformersStandard.shortener,
      reason: this.transformersStandard.shortener,
    }  
  };
  this.optionsVotingMachine = {
    transformers: {
      "peers.${label}": this.transformersStandard.shortener,
      "approvedMessages.${number}.aggregateSignature": this.transformersStandard.shortener,
      "approvedMessages.${number}.hash": this.transformersStandard.shortener,
      "approvedMessages.${number}.payloadHash": this.transformersStandard.shortener,
      "messages.debugStatus.lines.${number}": this.transformersStandard.middleShortener,
      "messages.errorLog.lines.${number}": this.transformersStandard.middleShortener,
      "messages.publicKey": this.transformersStandard.middleShortener,
      "debugStatus.lines.${number}": this.transformersStandard.middleShortener,
      "peers.${any}.debugStatus.lines.${number}": this.transformersStandard.middleShortener,
    },
  };
  this.callTypes = {
    standard: {
      jsonOptions: this.optionsKanbanGOStandard,
      idDefaultOutput: ids.defaults.kanbanGO.outputSendReceive,
      rpcCalls: kanbanGO.rpcCalls,
      url: pathnames.url.known.kanbanGO.rpc,
    },
    cryptoTest: {
      jsonOptions: this.optionsCrypto,
      idDefaultOutput: ids.defaults.kanbanGO.outputKBGOTest,
      rpcCalls: kanbanGO.rpcCalls,
      url: pathnames.url.known.kanbanGO.rpc,
    },
    initialization: {
      jsonOptions: this.optionsInitialization,
      rpcCalls: kanbanGOInitialization.rpcCalls,
      idDefaultOutput: ids.defaults.kanbanGO.outputKanbanInitialization,
      url: pathnames.url.known.kanbanGO.initialization,
    },
    votingMachine: {
      jsonOptions: this.optionsVotingMachine,
      rpcCalls: kanbanGO.rpcCalls,
      url: pathnames.url.known.kanbanGO.rpc,
      idDefaultOutput: ids.defaults.kanbanGO.outputSendReceive,
    },
    demo: {
      jsonOptions: this.optionsInitialization,
      idDefaultOutput: ids.defaults.kanbanGO.outputSendReceive,
      rpcCalls: kanbanGOInitialization.demoRPCCalls,
      url: pathnames.url.known.kanbanGO.initialization,
    }
  }; 
  // if rpcCall omitted it will be assumed to be equal to the function label.
  /**@type {Object.<string, rpcCall: string, output: string, outputs: Object, outputOptions: Object, inputs: Object, callback: Object, useOneNode: boolean>} */
  this.theFunctions  = {
    runNodesOnFAB: {
      inputs: {
        numberOfNodes: inputInitialization.numberOfNodes,
        abiJSON: inputInitialization.contractABI,
        contractId: inputInitialization.contractId,
        connectKanbansInALine: ids.defaults.kanbanGO.checkboxConnectKanbansInALine,
      },
      callback: PendingCall.prototype.callbackRunNodes,
      useOneNode: true
    },
    killAllGeth: {
      callback: this.getNodeInformationCallback.bind(this)
    },
    getLogFile: {
      outputOptions: {
        totalEntriesToDisplayAtEnds: 1000,
        transformers: {
          "${number}": this.transformersStandard.highlightErrorWords
        }
      }
    },
    getRPCLogFile: {
      outputOptions: {
        totalEntriesToDisplayAtEnds: 1000,
      },
    },
    getNodeInformation: {
      callType: this.callTypes.initialization
    },
    peerView: {
      outputJSON: ids.defaults.kanbanGO.outputSendReceive,
      outputOptions: this.optionsKanbanGOStandard
    },
    roundChangeRequests: {
      // if rpcCall omitted it will be assumed to be equal to the function label.
      rpcCall: kanbanGO.rpcCalls.roundChangeRequests.rpcCall,
      outputJSON: ids.defaults.kanbanGO.outputSendReceive,
      // This will transform some entries of the output json to buttons.
      // If outputOptions are omitted or set to null, 
      // optionsKanbanGOStandard will be used.
      // If the empty object {} is given, no transformations will be carried out.
      outputOptions: this.optionsKanbanGOStandard
    },
    getAccountsStates: {
      callback: PendingCall.prototype.callbackMakeAddressTable,
      outputOptions: this.optionsForAddressDisplay
    },
    getBlockByHash: {
      inputs: {
        blockHash: inputSendReceive.blockHash
      },
      outputs: {
        number: inputSendReceive.blockNumber
      },
      outputJSON: ids.defaults.kanbanGO.outputSendReceive
    },
    getBlockByNumber: {
      inputs: {
        blockNumber: inputSendReceive.blockNumber
      },
      outputs: {
        hash: inputSendReceive.blockHash        
      },
      outputJSON: ids.defaults.kanbanGO.outputSendReceive
    },
    round: {
      outputJSON: ids.defaults.kanbanGO.outputSendReceive
    },
    validators: {
      outputJSON: ids.defaults.kanbanGO.outputSendReceive,
      outputOptions: this.optionsKanbanGOLabelContraction
    },
    testSha3 : {
      //if rpcCall omitted it will be assumed to be equal to the function label.
      inputsBase64: {
        message: inputSchnorr.message
      },
      callType: "cryptoTest"
    },
    versionGO: {
    },
    votingNetStats: {
      callType: "votingMachine"
    },
    votingMachineStats: {
      callType: "votingMachine"
    },
    voteMessage: {
      inputs: {
        messageHex: ids.defaults.kanbanGO.inputSendReceive.messageVoteHex
      }
    },
    testPrivateKeyGeneration: {
      outputs: {
        privateKeyBase58Check: inputSchnorr.privateKey
      }
    },
    testPublicKeyFromPrivate: {
      inputs: {
        privateKey: inputSchnorr.privateKey
      },
      outputs: {
        publicKeyHex: inputSchnorr.publicKey
      }
    },
    testSchnorrSignature: {
      inputs: {
        privateKey: inputSchnorr.privateKey
      },
      inputsBase64: {
        messageBase64: inputSchnorr.message
      },
      outputs: {
        signatureBase58: inputSchnorr.signature
      }
    },
    testSchnorrVerification: {
      inputs: {
        publicKey: inputSchnorr.publicKey,
        signature: inputSchnorr.signature
      },
      inputsBase64: {
        messageBase64: inputSchnorr.message
      },
    },
    testAggregateGeneratePrivateKeys: {
      inputs: {
        numberOfPrivateKeysToGenerate: inputAggregate.numberOfPrivateKeysToGenerate
      },
      callback: PendingCall.prototype.callbackAggregatePrivateKeyGeneration
    },
    testAggregateInitialize: {
      inputsBase64: {
        privateKeys: inputAggregate.privateKeys
      },
      callback: PendingCall.prototype.callbackAggregateInitialization
    },
    testAggregateCommitment: {
      inputsBase64: {
        messageBase64: inputAggregate.message
      },
      callback: PendingCall.prototype.callbackAggregateCommitment
    },
    testAggregateChallenge: {
      inputs: {        
        committedSigners: inputAggregate.committedSignersBitmap
      },
      inputsBase64: {
        commitmentsBase64: inputAggregate.commitments,
      },
      outputs: {
        aggregator: {
          aggregateCommitment: inputAggregate.aggregateCommitment,
          aggregatePublicKey: inputAggregate.aggregatePublickey,
          messageDigest: inputAggregate.digest
        }
      }
    },
    testAggregateSolutions: {
      inputs: {
        committedSigners: inputAggregate.committedSignersBitmap,
        digest: inputAggregate.digest,
        aggregateCommitment: inputAggregate.aggregateCommitment,
        aggregatePublicKey: inputAggregate.aggregatePublickey
      },
      callback: PendingCall.prototype.callbackAggregateSolutions
    },
    testAggregateSignature: {
      inputs: {
        committedSigners: inputAggregate.committedSignersBitmap,
      },
      inputsBase64: {
        solutionsBase64: inputAggregate.solutions,
      },
      outputs: {
        aggregator: {
          signatureNoBitmap: inputAggregate.aggregateSignature,
          signatureUncompressed: [inputAggregate.aggregateSignatureUncompressed, ids.defaults.fabcoin.inputBlockInfo.txAggregateSignature],
          signatureComplete: inputAggregate.aggregateSignatureComplete,
        }
      }
    },
    testAggregateVerification: {
      inputsBase64: {
        messageBase64: inputAggregate.message,
        allPublicKeysBase64: inputAggregate.publicKeys,
      },
      inputs: {
        signature: inputAggregate.aggregateSignature,
        committedSigners: inputAggregate.committedSignersBitmap,
      },
    },
    testAggregateVerificationComplete: {
      inputsBase64: {
        messageBase64: inputAggregate.message,
      },
      inputs: {
        signatureComplete: inputAggregate.aggregateSignatureComplete,
      },
    },
    compileSolidity: {
      inputsBase64: {
        code: ids.defaults.fabcoin.inputBlockInfo.solidityInput
      },
      outputJSON: ids.defaults.fabcoin.outputSolidityCompilation,
      callback: PendingCall.prototype.callbackCompileSolidity,
      useOneNode: true,
    }, 
    fetchKanbanContract: {
      outputs: {
        code: ids.defaults.fabcoin.inputBlockInfo.solidityInput
      },
      outputJSON: ids.defaults.fabcoin.outputFabcoinBlockInfo,
      callback: PendingCall.prototype.callbackFetchSmartContract,
      useOneNode: true,
    },
    fetchDemoContract: {
      outputs: {
        code: ids.defaults.fabcoin.inputBlockInfo.solidityInput
      },
      callType: this.callTypes.demo,
      outputJSON: ids.defaults.fabcoin.outputFabcoinBlockInfo,
      callback: PendingCall.prototype.callbackFetchSmartContract
    },
    sendBenchmarkTransactions: {
      inputs: {
        privateKey: ids.defaults.kanbanGO.inputBenchmarkParameters.privateKey,
        toAddress: ids.defaults.kanbanGO.inputBenchmarkParameters.toAddress,
        transactionNumber: ids.defaults.kanbanGO.inputBenchmarkParameters.transactionNumber,
        transactionValue: ids.defaults.kanbanGO.inputBenchmarkParameters.transactionValue,
      }
    },
    fetchNodeConfig: {
      useOneNode: true,
    },
    testCreateTransactionStandard: {
      inputs: {
        inputs: ids.defaults.kanbanGO.inputSendReceive.txInputs,
        outputs: ids.defaults.kanbanGO.inputSendReceive.txOutputs,
      },
    },
    testCreateContractCall: {
      inputs: {
        input: ids.defaults.kanbanGO.inputSendReceive.transactionBuilderInputs,
      },
    }
  };
  this.correctFunctions();
}

KanbanGoNodes.prototype.computeContractData = function() {
  var contractIds = ids.defaults.fabcoin.inputBlockInfo; 
  var contractData = "";
  contractData += document.getElementById(contractIds.contractFunctionId).value;
  contractData += document.getElementById(contractIds.contractFunctionData).value;
  miscellaneousFrontEnd.updateValue(contractIds.contractData, contractData); 
}

KanbanGoNodes.prototype.setContractFunctionName = function(container, content, extraData) {
  var counterContract = extraData.labelArray[extraData.labelArray.length - 3];
  var counterFunction = extraData.labelArray[extraData.labelArray.length - 2];
  var ambientInput = extraData.ambientInput;
  var abi = extraData.ambientInput.ABI[counterContract][counterFunction];
  var keccakFirst8Hex = cryptoKanbanHashes.hashes.solidityGet8byteHexFromFunctionSpec(abi);
  //console.log(`DEBUG: fun signature so far: ${functionSignature}`);
  var contractIds = ids.defaults.fabcoin.inputBlockInfo; 
  if (abi.payable === false || abi.payable === "false") {
    miscellaneousFrontEnd.updateValue(contractIds.walletAmount, 0);
  }
  miscellaneousFrontEnd.updateValue(contractIds.contractHex, ambientInput.binaries[counterContract]);
  miscellaneousFrontEnd.updateValue(contractIds.contractFunctionName, content);
  miscellaneousFrontEnd.updateValue(contractIds.contractFunctionId, keccakFirst8Hex);
  this.computeContractData();
}

KanbanGoNodes.prototype.setContractHex = function(container, content, extraData) {
  var counter = extraData.labelArray[extraData.labelArray.length - 1];
  this.setInput(ids.defaults.fabcoin.inputBlockInfo.contractHex, null, extraData.ambientInput.binaries[counter]);
}

KanbanGoNodes.prototype.getSetInputWithShortener = function(idOutput) {
  return {
    clickHandler: this.setInput.bind(this, idOutput),
    transformer: miscellaneousBackend.hexShortener4Chars
  };  
}

KanbanGoNodes.prototype.setInput = function(idToSet, container, content, extraData) {
  //var extraDataString = JSON.stringify(extraData);
  //console.log(`DEBUG: Content: ${content}, extra data: ${extraDataString}`);
  miscellaneousFrontEnd.updateValue(idToSet, content);
}

KanbanGoNodes.prototype.getBlockByHash = function(container, inputHash) {
  miscellaneousFrontEnd.updateValue(ids.defaults.kanbanGO.inputSendReceive.blockHash, inputHash);
  miscellaneousFrontEnd.revealLongWithParent(container, inputHash);
  this.run('getBlockByHash');
}

KanbanGoNodes.prototype.correctFunctions = function() {  
  for (var label in this.theFunctions) {
    var currentCall = this.theFunctions[label];
    var actualLabel = currentCall.rpcCall;
    if (actualLabel === null || actualLabel === undefined) {
      actualLabel = label;
    }
    currentCall.rpcCall = actualLabel; 
    var currentRPCCall = kanbanGO.rpcCalls[label];
    if (currentRPCCall === undefined || currentRPCCall === null) {
      currentRPCCall = kanbanGOInitialization.rpcCalls[label];
    }
    if (currentRPCCall === undefined || currentRPCCall === null) {
      currentRPCCall = kanbanGOInitialization.demoRPCCalls[label];
    }
    if (currentRPCCall === undefined || currentRPCCall === null) {
      throw(`Fatal error: the kanbanGO rpc label ${label} is not an available rpc call. `);
    }
  }
}

KanbanGoNodes.prototype.testClear = function() {
  var inputAggregate = ids.defaults.kanbanGO.inputAggregateSignature;
  miscellaneousFrontEnd.updateValue(inputAggregate.numberOfPrivateKeysToGenerate, '5');
  miscellaneousFrontEnd.updateValue(inputAggregate.privateKeys, '');
  miscellaneousFrontEnd.updateValue(inputAggregate.nonces, '');
  miscellaneousFrontEnd.updateValue(inputAggregate.publicKeys, '');
  miscellaneousFrontEnd.updateValue(inputAggregate.committedSignersBitmap, '01111');
  miscellaneousFrontEnd.updateValue(inputAggregate.commitments, '');
  miscellaneousFrontEnd.updateValue(inputAggregate.digest, '');
  miscellaneousFrontEnd.updateValue(inputAggregate.aggregateCommitment, '');
  miscellaneousFrontEnd.updateValue(inputAggregate.aggregatePublickey, '');
  miscellaneousFrontEnd.updateValue(inputAggregate.solutions, '');
  miscellaneousFrontEnd.updateValue(inputAggregate.aggregateSignature, '');
  this.run('testAggregateGeneratePrivateKeys', 'cryptoTest');
}

KanbanGoNodes.prototype.run = function(functionLabel, callType, callbackOverridesStandard) {
  var callTypeSpec = callType;
  if (callTypeSpec === undefined) {
    if (functionLabel in this.theFunctions) {
      callTypeSpec = this.theFunctions[functionLabel].callType;
    }
    if (callTypeSpec === null || callTypeSpec === undefined) {
      callTypeSpec = "standard";
    }
  }
  if (typeof callTypeSpec === "string") {
    callTypeSpec = this.callTypes[callTypeSpec];
  }
  if (typeof callTypeSpec !== "object") {
    throw `Was not able to extract call type from: ${JSON.stringify(callTypeSpec)}`;
  }
  var currentId = this.selectedNode;
  if (functionLabel in this.theFunctions) {
    if (this.theFunctions[functionLabel].useOneNode) {
      currentId = "none";
    }
  }
  this.numberOfCalls ++;
  var currentPendingCall = new PendingCall();
  if (currentId !== "all") {
    currentPendingCall.nodeCalls[currentId] = {result: null};
  } else {
    for (var i = 0; i < this.nodes.length; i ++) {
      currentPendingCall.nodeCalls[this.nodes[i].idBackend] = {result: null};
    }
  }
  currentPendingCall.id = this.numberOfCalls;
  currentPendingCall.owner = this;
  currentPendingCall.callTypeSpec = callTypeSpec;
  currentPendingCall.callbackOverridesStandard = callbackOverridesStandard;
  this.pendingCalls[this.numberOfCalls] = currentPendingCall;
  currentPendingCall.run(functionLabel);
}

KanbanGoNodes.prototype.getNodeInformation = function() {
  this.run('getNodeInformation', 'initialization', this.getNodeInformationCallback.bind(this));
}

KanbanGoNodes.prototype.selectRadio = function(idRadio) {
  this.selectedNode = idRadio;
  //console.log(`DEBUG: set this.selectedNode to: ${idRadio} `);
}

KanbanGoNodes.prototype.toHTMLRadioButton = function() {
  var radioButtonHTML = "";
  radioButtonHTML += `<label class = "containerRadioButton">`;
  radioButtonHTML += `<input type = "radio" name = "rpcKanbanGO" id = "kanbanGoNodeSelector_all" `;
  radioButtonHTML += ` onchange = "window.kanban.kanbanGO.rpc.theKBNodes.selectRadio('all')" `; 
  if (this.selectedNode === "all") {
    radioButtonHTML += "checked";
  }
  radioButtonHTML += `>`;
  radioButtonHTML += `<span class = "radioMark"></span>`;
  radioButtonHTML += `all`;
  radioButtonHTML += `</label>`;

  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    radioButtonHTML += this.nodes[counterNode].toHTMLRadioButton();
  } 
  return radioButtonHTML;
}

KanbanGoNodes.prototype.getNodeInformationCallback = function(input, output) {
  //console.log("DEBUG: Got back:" + input);
  try {
    var inputParsed = JSON.parse(input);
    if (this.nodes.length === inputParsed.length) {
      return;
    }
    this.nodes = [];
    if (this.selectedNode === "none" && inputParsed.length > 0) {
      this.selectedNode = "all";
    } else {
      this.selectedNode = "none";
    }

    for (var counterNode = 0; counterNode < inputParsed.length; counterNode ++) {
      var currentNode = new KanbanGONode();
      currentNode.init(inputParsed[counterNode]);
      //console.log("DEBUG: This selected node: " + this.selectedNode + " id backend:  " + currentNode.idBackend);
      if (this.selectedNode === currentNode.idBackend) {
        console.log("Debug: selecting node: " + currentNode.idBackend);
        currentNode.flagSelected = true;
      }
      this.nodes.push(currentNode);
    } 
  } catch (e) {
    console.log(`Error while updating node information panel. ${e}`);
  }
  var nodePanel = document.getElementById(ids.defaults.kanbanGO.nodePanel);
  nodePanel.innerHTML = this.toHTMLRadioButton();  
}

KanbanGoNodes.prototype.readCheckboxesConfiguration = function() {
  /** @type {StorageKanban} */
  var storageKanban = window.kanban.storageKanban;
  var idCheckboxPairs = [[
      storageKanban.variables.autostartFabcoindAfterKanbanGO, 
      ids.defaults.kanbanGO.checkboxFabcoindAutostartAfterKanbanGO,
    ], [
      storageKanban.variables.connectKanbansInALine,
      ids.defaults.kanbanGO.checkboxConnectKanbansInALine,
    ],
  ];
  for (var i = 0; i < idCheckboxPairs.length; i ++) {
    var checkBox = document.getElementById(idCheckboxPairs[i][1]);
    storageKanban.setVariable(idCheckboxPairs[i][0], checkBox.checked);
  }
}

var theKBNodes = new KanbanGoNodes();

module.exports = {
  theKBNodes
}
