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
    shortener: {
      transformer: miscellaneousBackend.hexShortenerForDisplay,
    },
    veryShort: {
      transformer: miscellaneousBackend.hexVeryShortDisplay,
    },
    blockHash: {
      clickHandler: this.getBlockByHash.bind(this),
      transformer: miscellaneousBackend.hexShortenerForDisplay,
    },
    contractHexSetter: {
      clickHandler: this.setContractHex.bind(this),
      transformer: miscellaneousBackend.hexShortenerForDisplay,
    },
    contractCallSetter: {
      clickHandler: this.setContractFunctionName.bind(this),
      transformer: miscellaneousBackend.hexShortenerForDisplay,
    },
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
    }
  };
  this.optionsKanbanGOLabelContraction = {};
  this.optionsKanbanGOLabelContraction.transformers = Object.assign({}, this.optionsKanbanGOStandard.transformers);
  this.optionsKanbanGOLabelContraction.transformers["${label}"] = this.transformersStandard.shortener;

  this.optionsInitialization = {
    transformers: {
      "binaries.${number}": this.transformersStandard.contractHexSetter,
      "contractNames.${number}": this.transformersStandard.contractHexSetter,
      "ABI.${number}.${number}.name": this.transformersStandard.contractCallSetter
    }
  };
  this.callTypes = {
    standard: {
      jsonOptions: this.optionsKanbanGOStandard,
      idDefaultOutput: ids.defaults.kanbanGO.outputSendReceive,
      rpcCalls: kanbanGO.rpcCalls,
      url: pathnames.url.known.kanbanGO.rpc,
    },
    cryptoTest: {
      jsonOptions: this.optionsKanbanGOStandard,
      idDefaultOutput: ids.defaults.kanbanGO.outputKBGOTest,
      rpcCalls: kanbanGO.rpcCalls,
      url: pathnames.url.known.kanbanGO.rpc,
    },
    initialization: {
      jsonOptions: this.optionsInitialization,
      rpcCalls: kanbanGOInitialization.rpcCalls,
      idDefaultOutput: ids.defaults.kanbanGO.outputKanbanInitialization,
      url: pathnames.url.known.kanbanGO.initialization,
    }
  }; 
  // if rpcCall omitted it will be assumed to be equal to the function label.
  /**@type {Object.<string, rpcCall: string, output: string, outputOptions: Object, inputs: Object>} */
  this.theFunctions  = {
    runNodes: {
      inputs: {
        numberOfNodes: inputInitialization.numberOfNodes
      },
      callback: PendingCall.prototype.callbackRunNodes,
    },
    getNodeInformation: {
      callback: this.getNodeInformationCallback.bind(this)
    },
    peerView: {
      output: ids.defaults.kanbanGO.outputSendReceive,
      outputOptions: this.optionsKanbanGOStandard
    },
    roundChangeRequests: {
      // if rpcCall omitted it will be assumed to be equal to the function label.
      rpcCall: kanbanGO.rpcCalls.roundChangeRequests.rpcCall,
      output: ids.defaults.kanbanGO.outputSendReceive,
      // This will transform some entries of the output json to buttons.
      // If outputOptions are omitted or set to null, 
      // optionsKanbanGOStandard will be used.
      // If the empty object {} is given, no transformations will be carried out.
      outputOptions: this.optionsKanbanGOStandard
    },
    getBlockByHash: {
      inputs: {
        blockHash: inputSendReceive.blockHash
      },
      outputs: {
        number: inputSendReceive.blockNumber
      },
      output: ids.defaults.kanbanGO.outputSendReceive
    },
    getBlockByNumber: {
      inputs: {
        blockNumber: inputSendReceive.blockNumber
      },
      outputs: {
        hash: inputSendReceive.blockHash        
      },
      output: ids.defaults.kanbanGO.outputSendReceive
    },
    round: {
      output: ids.defaults.kanbanGO.outputSendReceive
    },
    validators: {
      output: ids.defaults.kanbanGO.outputSendReceive,
      outputOptions: this.optionsKanbanGOLabelContraction
    },
    testSha3 : {
      //if rpcCall omitted it will be assumed to be equal to the function label.
      rpcCall: kanbanGO.rpcCalls.testSha3.rpcCall, 
      inputs: {
        message: inputSchnorr.message
      }
    },
    versionGO: {
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
    testAggregateInitialize: {
      inputs: {
        numberOfPrivateKeysToGenerate: inputAggregate.numberOfPrivateKeysToGenerate
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
          signatureNoBitmap: inputAggregate.aggregateSignature
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
    compileSolidity: {
      inputsBase64: {
        code: ids.defaults.fabcoin.inputBlockInfo.solidityInput
      },
      output: ids.defaults.fabcoin.outputFabcoinBlockInfo
    }, 
    fetchKanbanContract: {
      outputs: {
        code: ids.defaults.fabcoin.inputBlockInfo.solidityInput
      },
      output: ids.defaults.fabcoin.outputFabcoinBlockInfo,
      callback: this.callbackSolidityCode
    }
  };
  this.correctFunctions();
}

KanbanGoNodes.prototype.setContractFunctionName = function (container, content, extraData) {
  var counter = extraData.labelArray[extraData.labelArray.length - 2];
  this.setInput(ids.defaults.fabcoin.inputBlockInfo.contractHex, null, extraData.ambientInput.binaries[counter]);
  this.setInput(ids.defaults.fabcoin.inputBlockInfo.contractFunctionName, null, content);
}

KanbanGoNodes.prototype.setContractHex = function (container, content, extraData) {
  var counter = extraData.labelArray[extraData.labelArray.length - 1];
  this.setInput(ids.defaults.fabcoin.inputBlockInfo.contractHex, null, extraData.ambientInput.binaries[counter]);
}

KanbanGoNodes.prototype.getSetInputWithShortener = function (idOutput) {
  return {
    clickHandler: this.setInput.bind(this, idOutput),
    transformer: miscellaneousBackend.hexShortenerForDisplay
  };  
}

KanbanGoNodes.prototype.setInput = function (idToSet, container, content, extraData) {
  //var extraDataString = JSON.stringify(extraData);
  //console.log(`DEBUG: Content: ${content}, extra data: ${extraDataString}`);
  submitRequests.updateValue(idToSet, content);
}

KanbanGoNodes.prototype.getBlockByHash = function (container, inputHash) {
  submitRequests.updateValue(ids.defaults.kanbanGO.inputSendReceive.blockHash, inputHash);
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
      throw(`Fatal error: the kanbanGO rpc label ${label} is not an available rpc call. `);
    }
  }
}

KanbanGoNodes.prototype.testClear = function() {
  var inputAggregate = ids.defaults.kanbanGO.inputAggregateSignature;
  submitRequests.updateValue(inputAggregate.numberOfPrivateKeysToGenerate, '5');
  submitRequests.updateValue(inputAggregate.privateKeys, '');
  submitRequests.updateValue(inputAggregate.nonces, '');
  submitRequests.updateValue(inputAggregate.publicKeys, '');
  submitRequests.updateValue(inputAggregate.committedSignersBitmap, '01111');
  submitRequests.updateValue(inputAggregate.commitments, '');
  submitRequests.updateValue(inputAggregate.digest, '');
  submitRequests.updateValue(inputAggregate.aggregateCommitment, '');
  submitRequests.updateValue(inputAggregate.aggregatePublickey, '');
  submitRequests.updateValue(inputAggregate.solutions, '');
  submitRequests.updateValue(inputAggregate.aggregateSignature, '');
}

KanbanGoNodes.prototype.run = function(functionLabel, callType) {
  if (callType === undefined) {
    callType = "standard";
  }
  if (! (callType in this.callTypes)) {
    throw `Call type not among the allowed call types: ${Object.keys(this.callTypes)}`;
  }
  var currentId = this.selectedNode;
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
  currentPendingCall.callType = callType;
  this.pendingCalls[this.numberOfCalls] = currentPendingCall;
  currentPendingCall.run(functionLabel);
}

KanbanGoNodes.prototype.getNodeInformation = function () {
  this.run('getNodeInformation', 'initialization');
}

KanbanGoNodes.prototype.selectRadio = function (idRadio) {
  this.selectedNode = idRadio;
  //console.log(`DEBUG: set this.selectedNode to: ${idRadio} `);
}

KanbanGoNodes.prototype.toHTMLRadioButton = function () {
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

KanbanGoNodes.prototype.getNodeInformationCallback = function (functionLabel, input, output) {
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
        //console.log("DEbug: selecting node: " + currentNode.idBackend);
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

var theKBNodes = new KanbanGoNodes();

module.exports = {
  theKBNodes
}