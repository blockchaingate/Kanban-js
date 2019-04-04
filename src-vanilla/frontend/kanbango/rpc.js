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
    getBlockByNumber: {
      clickHandler: this.getBlockByNumber.bind(this),
      tooltip: "Sets the block number field and fetches the block. "
    },
    setBlockNumber: {
      clickHandler: this.setInput.bind(this, ids.defaults.kanbanGO.inputSendReceive.blockNumber),
      tooltip: "Sets the block number field."
    },
    convertHexToBigInteger: {
      transformer: miscellaneousBackend.convertHexToBigInteger,
      clickHandler: this.clickFABBalance.bind(this),
    },
    setTransactionHex: {
      clickHandler: this.setTransactionHex.bind(this),
      transformer: miscellaneousBackend.hexShortener8Chars,
      tooltip: "Set the tx hex input and decode the transaction. ",
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
      nextBlock: this.transformersStandard.blockHash,
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
      messageHex: this.transformersStandard.shortener,
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
      "comments.decodedInputs.${number}.txid": this.transformersStandard.shortener,
      "comments.decodedOutputs.contract.contractAddress": this.transformersStandard.shortener,
      "comments.decodedOutputs.contract.data": this.transformersStandard.shortener,
      "hex": this.transformersStandard.shortener,
      "hashHex": this.transformersStandard.shortener,
      hashBase64: this.transformersStandard.shortener,
      "inputTransactionHex": this.transformersStandard.shortener,
      "transaction.inputs.${number}.txid": this.transformersStandard.shortener,
      "transaction.inputs.${number}.unlockScript": this.transformersStandard.shortener,
      "transaction.inputs.${number}.lockScript": this.transformersStandard.shortener,
      "transaction.outputs.${number}.lockScript": this.transformersStandard.shortener,
      "input.txInputs" : this.transformersStandard.shortener,
      "input.txOutputs": this.transformersStandard.shortener,
      "comments.bytesToSign.${number}": this.transformersStandard.shortener,
      "comments.builder.inputs.${number}.unlockScript": this.transformersStandard.shortener,
      "smartContractId": this.transformersStandard.shortener,
      blockNumberHex: this.transformersStandard.getBlockByNumber,
      currentBlockNumberHex: this.transformersStandard.getBlockByNumber,
      currentBlockHash: this.transformersStandard.blockHash,
      comments: this.transformersStandard.shortener,
      "lastCallContract.smartContractId": this.transformersStandard.shortener,
      "lastFabcoindRPCCallsPerCallType.sendrawtransaction.inputs.${number}": this.transformersStandard.shortener,
      "lastFabcoindRPCCallsPerCallType.sendrawtransaction.output": this.transformersStandard.shortener,
      "_writeBack": this.transformersStandard.shortener,
      "bytesToSign.${number}": this.transformersStandard.shortener,
      "bytesForSignatureWithoutAncestor": this.transformersStandard.shortener,
      "defaultShardId": this.transformersStandard.shortener,
      "shardId": this.transformersStandard.shortener,
      "pbftConfig.validatorPublicKeysHex.${number}": this.transformersStandard.shortener,
      "pbftConfig.validators.${number}": this.transformersStandard.shortener,
      "FAB" : this.transformersStandard.convertHexToBigInteger,
      "AddressesChanged.${any}": this.transformersStandard.shortener,
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

  this.optionsInitialization = {
    totalEntriesToDisplayAtEnds: 30,
    transformers: {
      myEnodeAddress: this.transformersStandard.shortener16,
      argumentsGeth: this.transformersStandard.veryShort,
      argumentsGethOneLine: this.transformersStandard.veryShort,
      "myConnections.${number}": this.transformersStandard.shortener16,
      "secretKey": this.transformersStandard.shortener,
      "binaries.${number}": this.transformersStandard.contractHexSetter,
      "contractNames.${number}": this.transformersStandard.contractHexSetter,
      "ABI.${number}.${number}.name": this.transformersStandard.contractCallSetter,
      "resultHTML": this.transformersStandard.shortener,
      "code": this.transformersStandard.contractSourceSetter,
      "contractInheritance.${label}": this.transformersStandard.shortener,
      "node.${number}.${number}": this.transformersStandard.shortener16,
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
      fabAddressMainnetHexNoCheck: this.transformersStandard.shortener,
      inputPrivateKey: this.transformersStandard.shortener,
      fabAddressTestnetBase58Check: this.transformersStandard.shortener,
      fabAddressTestnetHexNoCheck: this.transformersStandard.shortener,
      inputPrivateKeyBase58: this.transformersStandard.setPrivateKeySchnorr,
      inputPrivateKeyBase58CheckRecoded: this.transformersStandard.setPrivateKeySchnorr,
      inputPrivateKeyBase58Recoded: this.transformersStandard.setPrivateKeySchnorr,
      inputPrivateKeyHex: this.transformersStandard.setPrivateKeySchnorr,
      inputPrivateKeys: this.transformersStandard.shortener,
      publicKeyHex: this.transformersStandard.setPublicKeySchnorr,
      publicKeyHexInternal: this.transformersStandard.setPublicKeySchnorr,
      inputMessageHex: this.transformersStandard.shortener,
      inputPublicKeyHex: this.transformersStandard.setPublicKeySchnorr,
      inputPublicKeyHexRecoded: this.transformersStandard.setPublicKeySchnorr,
      inputSignatureBase58: this.transformersStandard.setSignatureSchnorr,
      inputSignatureBase58Recoded: this.transformersStandard.setSignatureSchnorr,
      signatureBase58: this.transformersStandard.setSignatureSchnorr,
      signatureHex: this.transformersStandard.shortener,
      inputSignatureHexRecoded: this.transformersStandard.shortener,
      inputSignatureHex: this.transformersStandard.shortener,
      inputSignature: this.transformersStandard.shortener,
      "privateKeys.${number}": this.transformersStandard.setPrivateKeySchnorr,
      "aggregator.publicKeys.${number}": this.transformersStandard.shortener,
      "aggregator.aggregateCommitment": this.transformersStandard.shortener,
      "aggregator.aggregatePublicKey": this.transformersStandard.shortener,
      "aggregator.commitments.${number}": this.transformersStandard.shortener,
      "aggregator.lockingCoefficients.${number}": this.transformersStandard.shortener,
      "aggregator.messageHex": this.transformersStandard.shortener,
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
      "signers.${number}.messageHex": this.transformersStandard.shortener,
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
      "approvedMessages.${number}.payloadHash": this.transformersStandard.shortener,
      "approvedMessages.${number}.hash": this.transformersStandard.shortener,
      "approvedMessages.${number}.dataAndAuthorization.aggregateSignature": this.transformersStandard.shortener,
      "approvedMessages.${number}.dataAndAuthorization.payload": this.transformersStandard.shortener,
      "approvedMessages.${number}.dataAndAuthorization.payload.message": this.transformersStandard.shortener,
      "approvedMessages.${number}.dataAndAuthorization.payload.payloadHash": this.transformersStandard.shortener,
      "approvedMessages.${number}.dataAndAuthorization.payload.serialization": this.transformersStandard.shortener,
      "approvedMessages.${number}.writeBackTransaction": this.transformersStandard.setTransactionHex,
      "messages.debugStatus.lines.${number}": this.transformersStandard.middleShortener,
      "messages.errorLog.lines.${number}": this.transformersStandard.middleShortener,
      "messages.publicKey": this.transformersStandard.middleShortener,
      "messages.allPublicKeys.${number}": this.transformersStandard.middleShortener,
      "debugStatus.lines.${number}": this.transformersStandard.middleShortener,
      "peers.${any}.debugStatus.lines.${number}": this.transformersStandard.middleShortener,
      "inputHex": this.transformersStandard.shortener,
      "payloadHash": this.transformersStandard.shortener,
      "votePayload.message": this.transformersStandard.shortener,
      "votePayload.payloadHash": this.transformersStandard.shortener,
      "votePayload.serialization": this.transformersStandard.shortener,
      "votePayload": this.transformersStandard.shortener,
      "slots.${number}.payloadHash": this.transformersStandard.shortener,
    },
  };
  this.callTypes = {
    standard: {
      callType: "kanbanLocal",
      jsonOptions: this.optionsKanbanGOStandard,
      idDefaultOutput: ids.defaults.kanbanGO.outputSendReceive,
      rpcCalls: kanbanGO.rpcCalls,
      url: pathnames.url.known.kanbanGO.rpc,
    },
    cryptoTest: {
      callType: "kanbanLocal",
      jsonOptions: this.optionsCrypto,
      idDefaultOutput: ids.defaults.kanbanGO.outputKBGOTest,
      rpcCalls: kanbanGO.rpcCalls,
      url: pathnames.url.known.kanbanGO.rpc,
    },
    initialization: {
      callType: "kanbanLocal",
      jsonOptions: this.optionsInitialization,
      rpcCalls: kanbanGOInitialization.rpcCalls,
      idDefaultOutput: ids.defaults.kanbanGO.outputKanbanInitialization,
      url: pathnames.url.known.kanbanGO.initialization,
    },
    votingMachine: {
      callType: "kanbanLocal",
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
    },
    myNodes: {
      callType: "myNodesSSH",
      jsonOptions: this.optionsMyNodes,
      idDefaultOutput: ids.defaults.myNodes.outputMyNodes,
      rpcCalls: kanbanGOInitialization.rpcCalls,
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
        bridgeChainnet: inputInitialization.bridgeChainnet,
        chainId: inputInitialization.chainId,
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
      outputOptions: this.optionsForAddressDisplay
    },
    getMainChainAccountsBalance: {
      outputOptions: this.optionsForAddressDisplay,
    },
    getBestBlockNumber: {
      outputs: {
        blockNumberHex: inputSendReceive.blockNumber, 
      }
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
      outputOptions: this.optionsForAddressDisplay
    },
    pbftConfig: {
      outputJSON: ids.defaults.kanbanGO.outputSendReceive
    },
    testSha2: {
      //if rpcCall omitted it will be assumed to be equal to the function label.
      inputs: {
        messageHex: inputSchnorr.messageHex
      },
      callType: "cryptoTest"
    },
    helloWorld: {
      inputs: {
        inputName: ids.defaults.kanbanGO.inputTransfers.nameInputForHelloWorld
      },
      outputJSON: ids.defaults.kanbanGO.outputTransfer
    },
    sandBox: {
      inputs: {
        inputName: ids.defaults.kanbanGO.inputTransfers.nameInputForSandbox
      },
      outputJSON: ids.defaults.kanbanGO.outputTransferForSandbox
    },
    getBalanceFromAddress: {
      inputs: {
        address: ids.defaults.kanbanGO.inputSendReceive.accountAddress
      },
      //callback: PendingCall.prototype.callbackBalanceTable,
      outputJSON: ids.defaults.kanbanGO.outputSendReceive
    },
    getAddressesChanged: {
      inputs: {
        fromBlockNr: ids.defaults.kanbanGO.inputSendReceive.fromBlockNr,
        toBlockNr: ids.defaults.kanbanGO.inputSendReceive.toBlockNr
      },
      outputJSON: ids.defaults.kanbanGO.outputSendReceive
    },
    sendTransaction: {
      inputs: {
        from: ids.defaults.kanbanGO.inputSendReceive.fromAddress,
        to: ids.defaults.kanbanGO.inputSendReceive.toAddress,
        gas: ids.defaults.kanbanGO.inputSendReceive.gasLimit,
        gasPrice: ids.defaults.kanbanGO.inputSendReceive.gasPrice,
        value: ids.defaults.kanbanGO.inputSendReceive.txValue,
      },
      outputJSON: ids.defaults.kanbanGO.outputSendReceive
    },
    getAccountInfo: {
      inputs: {
        address: ids.defaults.kanbanGO.inputSendReceive.addressToGetAccountInfo,
      },
      outputJSON: ids.defaults.kanbanGO.outputSendReceive,
    },
    getShardAccounts: {
      outputJSON: ids.defaults.kanbanGO.outputSendReceive
    },
    encrypRIPEMD: {
      inputs: {
        inputName: ids.defaults.kanbanGO.inputTransfers.nameInputForRIPEMD
      },
      outputJSON: ids.defaults.kanbanGO.outputTransferForRIPEMD
    },
    testSha2Squared: {
      //if rpcCall omitted it will be assumed to be equal to the function label.
      inputs: {
        messageHex: inputSchnorr.messageHex
      },
      callType: "cryptoTest"
    },
    testSha3 : {
      //if rpcCall omitted it will be assumed to be equal to the function label.
      inputs: {
        messageHex: inputSchnorr.messageHex
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
    writeMessageToBlockHeader: {
      callType: "standard",
      inputs: {
        messageHex: ids.defaults.kanbanGO.inputSendReceive.messageVoteHex,
      },
    },
    generateWriteBack: {
      callType: "standard",
      inputs: {
        messageHex: ids.defaults.kanbanGO.inputSendReceive.messageVoteHex,
        gasLimit: ids.defaults.kanbanGO.inputSendReceive.gasLimit,
        gasPrice: ids.defaults.kanbanGO.inputSendReceive.gasPrice,
      },
    },
    generateWriteBackWithdrawal: {
      callType: "standard",
      inputs: {
        addressBeneficiary: ids.defaults.kanbanGO.inputSendReceive.accountAddress,
        gasLimit: ids.defaults.kanbanGO.inputSendReceive.gasLimit,
        gasPrice: ids.defaults.kanbanGO.inputSendReceive.gasPrice,
      },
    },
    voteMessageAndWriteToHeader: {
      callType: "standard",
      inputs: {
        messageHex: ids.defaults.kanbanGO.inputSendReceive.messageVoteHex,
      },
    },
    testVote: {
      inputs: {
        messageHex: ids.defaults.kanbanGO.inputSendReceive.messageVoteHex
      },
      callType: this.callTypes.votingMachine
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
    testECDSASignature: {
      inputs: {
        privateKey: inputSchnorr.privateKey,
        messageHex: inputSchnorr.messageHex
      },
      outputs: {
        signatureHex: inputSchnorr.signature
      }
    },
    testECDSAVerification: {
      inputs: {
        publicKey: inputSchnorr.publicKey,
        signature: inputSchnorr.signature,
        messageHex: inputSchnorr.messageHex
      },
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
      inputs: {
        privateKeys: inputAggregate.privateKeys
      },
      callback: PendingCall.prototype.callbackAggregateInitialization
    },
    testAggregateCommitment: {
      inputs: {
        messageHex: inputAggregate.messageHex
      },
      callback: PendingCall.prototype.callbackAggregateCommitment
    },
    testAggregateChallenge: {
      inputs: {        
        committedSigners: inputAggregate.committedSignersBitmap,
        commitments: inputAggregate.commitments,
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
        solutions: inputAggregate.solutions,
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
      inputs: {
        messageHex: inputAggregate.messageHex,
        allPublicKeys: inputAggregate.publicKeys,
        signature: inputAggregate.aggregateSignature,
        committedSigners: inputAggregate.committedSignersBitmap,
      },
    },
    testAggregateVerificationComplete: {
      inputs: {
        messageHex: inputAggregate.messageHex,
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
    fetchKanbanContractTwo: {
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
    fetchLocalRegtestNodeConfig: {
      useOneNode: true,
    },
    testCreateAndSignTransactionStandard: {
      inputs: {
        inputs: ids.defaults.kanbanGO.inputSendReceive.txInputs,
        outputs: ids.defaults.kanbanGO.inputSendReceive.txOutputs,
      },
      outputs: {
        hex: [ids.defaults.kanbanGO.inputSendReceive.txHex, ids.defaults.fabcoin.inputBlockInfo.txHex],
      },
    },
    decodeFabcoinTransactionHex: {
      inputs: {
        transactionHex: ids.defaults.kanbanGO.inputSendReceive.txHex,
      },
    },
    fetchMyNodesInfo: {
      callType: this.callTypes.myNodes,
      callback: PendingCall.prototype.writeNodeList
    },
    bridgeStatus: {
      outputJSON: ids.defaults.kanbanGO.outputKanbanInitialization
    },
    executeOverSSH: {
      callType: this.callTypes.myNodes,
      inputs: {
        commandSSH: ids.defaults.myNodes.inputSSH.command
      }
    },
    getExternalTransaction: {
      inputs: {
        txid: ids.defaults.kanbanGO.inputSendReceive.txInIds
      }
    },

  };
  this.correctFunctions();
}

KanbanGoNodes.prototype.clickFABBalance = function (container, input, extraData) {
  console.log("This is a sample click handler. ");
  console.log("DEBUG Input: " + input);
}

KanbanGoNodes.prototype.computeContractData = function() {
  var contractIds = ids.defaults.fabcoin.inputBlockInfo; 
  var contractData = "";
  contractData += document.getElementById(contractIds.contractFunctionId).value;
  contractData += document.getElementById(contractIds.contractFunctionArguments).value;
  miscellaneousFrontEnd.updateValue(contractIds.contractData, contractData); 
  var contractIdsKanbanGo = ids.defaults.kanbanGO.inputSendReceive; 
  contractData = "";
  contractData += document.getElementById(contractIdsKanbanGo.contractFunctionId).value;
  contractData += document.getElementById(contractIdsKanbanGo.contractFunctionArguments).value;
  miscellaneousFrontEnd.updateValue(contractIdsKanbanGo.contractData, contractData); 
}

KanbanGoNodes.prototype.setContractFunctionName = function(container, content, extraData) {
  var counterContract = extraData.labelArray[extraData.labelArray.length - 3];
  var counterFunction = extraData.labelArray[extraData.labelArray.length - 2];
  var ambientInput = extraData.ambientInput;
  var abi = extraData.ambientInput.ABI[counterContract][counterFunction];
  var keccakFirst8Hex = cryptoKanbanHashes.hashes.solidityGet8byteHexFromFunctionSpec(abi);
  //console.log(`DEBUG: fun signature so far: ${functionSignature}`);
  var inputsFab = ids.defaults.fabcoin.inputBlockInfo; 
  var inputsKanbanGo = ids.defaults.kanbanGO.inputSendReceive;
  if (abi.payable === false || abi.payable === "false") {
    miscellaneousFrontEnd.updateValue(inputsFab.txBeneficiaryAmounts, 0);
    miscellaneousFrontEnd.updateValue(inputsKanbanGo.txBeneficiaryAmounts, 0);
  }
  miscellaneousFrontEnd.updateValue(inputsFab.contractHex, ambientInput.binaries[counterContract]);
  miscellaneousFrontEnd.updateValue(inputsFab.contractFunctionName, content);
  miscellaneousFrontEnd.updateValue(inputsKanbanGo.contractFunctionName, content);
  miscellaneousFrontEnd.updateValue(inputsFab.contractFunctionId, keccakFirst8Hex);
  miscellaneousFrontEnd.updateValue(inputsKanbanGo.contractFunctionId, keccakFirst8Hex);
  this.computeContractData();
}

KanbanGoNodes.prototype.setTransactionHex = function(container, content, extraData) {
  this.setInput(ids.defaults.kanbanGO.inputSendReceive.txHex, container, content, extraData);
  this.setInput(ids.defaults.fabcoin.inputBlockInfo.txHex, container, content, extraData);
  this.run('decodeFabcoinTransactionHex');
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

KanbanGoNodes.prototype.getBlockByNumber = function(container, inputNumber) {
  miscellaneousFrontEnd.updateValue(ids.defaults.kanbanGO.inputSendReceive.blockNumber, inputNumber);
  this.run('getBlockByNumber');
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

KanbanGoNodes.prototype.computeNodeIds = function(functionLabel, callTypeSpec, currentPendingCall) {
  this.numberOfCalls ++;
  if (functionLabel in this.theFunctions) {
    if (this.theFunctions[functionLabel].useOneNode) {
      currentPendingCall.nodeCalls["none"] = {result: null};
      return;
    }
  }
  var callType = callTypeSpec.callType;
  if (callType === undefined || callType === null) {
    callType = "kanbanLocal"
  } 
  if (callType === "kanbanLocal" ) {
    return this.computeNodeIdsForKanban(currentPendingCall);
  }
  if (callType === "myNodesSSH") {
    return this.computeNodeIdsForSSH(currentPendingCall);
  }
  throw(`Uknown call type ${callType}`);
}

KanbanGoNodes.prototype.computeNodeIdsForSSH = function(currentPendingCall) {
  var machineNamesRaw = document.getElementById(ids.defaults.myNodes.inputSSH.machineNames).value;
  var machineNames = miscellaneousBackend.splitMultipleDelimiters(machineNamesRaw, " ,\t;");
  if (machineNames.length <= 0) {
    machineNames.push("no_machine_name_specified");
  }  
  for (var i = 0; i < machineNames.length; i ++) {
    currentPendingCall.nodeCalls[machineNames[i]] = {result: null};
  }
}

KanbanGoNodes.prototype.computeNodeIdsForKanban = function(currentPendingCall) {
  var currentId = this.selectedNode;
  if (currentId !== "all") {
    currentPendingCall.nodeCalls[currentId] = {result: null};
    return;
  } 
  for (var i = 0; i < this.nodes.length; i ++) {
    currentPendingCall.nodeCalls[this.nodes[i].idBackend] = {result: null};
  }
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
  var currentPendingCall = new PendingCall();
  this.computeNodeIds(functionLabel, callTypeSpec, currentPendingCall);
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
        //console.log("Debug: selecting node: " + currentNode.idBackend);
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
  var idCheckboxPairs = window.kanban.thePage.checkboxBindingsWithId;
  for (var i = 0; i < idCheckboxPairs.length; i ++) {
    var checkBox = document.getElementById(idCheckboxPairs[i][1]);
    storageKanban.setVariable(idCheckboxPairs[i][0], checkBox.checked);
  }

}

var theKBNodes = new KanbanGoNodes();

module.exports = {
  theKBNodes
}
