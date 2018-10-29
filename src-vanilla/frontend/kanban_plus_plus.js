"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
//const Block = require('../bitcoinjs_src/block');
const globals = require('./globals');
const miscellaneous = require('../miscellaneous');
const miscellaneousFrontEnd = require('./miscellaneous_frontend');

function setAddress(container) {
  submitRequests.updateValue(ids.defaults.kanbanPlusPlus.inputAddressDefault, container.getAttribute("content"));
  submitRequests.updateValue(ids.defaults.kanbanPlusPlus.inputSchnorrSignature.privateKey, "");
}

function setSignatureSchnorr(container) {
  submitRequests.updateValue(ids.defaults.kanbanPlusPlus.inputSchnorrSignature.signature, container.getAttribute("content"));
}

function setNonceSchnorr(container) {
  submitRequests.updateValue(ids.defaults.kanbanPlusPlus.inputSchnorrSignature.nonce, container.getAttribute("content"));
}

var optionsForKanbanPlusPlusGeneralStandard = {
  transformers: {
    address : {
      handlerName: setAddress.name,
      transformer: miscellaneous.hexShortenerForDisplay
    },
    signatureSchnorrBase58: {
      handlerName: setSignatureSchnorr.name,
      transformer: miscellaneous.hexShortenerForDisplay
    },
    nonceSchnorrBase58Check: {
      handlerName: setNonceSchnorr.name,
      transformer: miscellaneous.hexShortenerForDisplay
    }
  }
}

miscellaneousFrontEnd.attachModuleFullNameToHandlerNames(
  optionsForKanbanPlusPlusGeneralStandard.transformers, 
  "window.kanban.kanbanPlusPlus.general"
);

function callbackKanbanPlusPlusSignatureVerification(input, output) {
  var transformer = new jsonToHtml.JSONTransformer();
  transformer.writeJSONtoDOMComponent(input, output, optionsForKanbanPlusPlusGeneralStandard);
  if (typeof output === "string") {
    output = document.getElementById(output);
  }
  var inputParsed = JSON.parse(input);
  if (inputParsed.result === 1) {
    output.innerHTML = "<b style='color:green'>Verified</b><br>" + output.innerHTML;
  } else {
    output.innerHTML = "<b style='color:red'>Failed</b><br>" + output.innerHTML;
  }
}

function callbackKanbanPlusPlusGeneralStandard(input, output){
  var transformer = new jsonToHtml.JSONTransformer();
  transformer.writeJSONtoDOMComponent(input, output, optionsForKanbanPlusPlusGeneralStandard);
}

function callbackKanbanPlusPlusGeneralCrypto(input, output){
  var transformer = new jsonToHtml.JSONTransformer();
  transformer.writeJSONtoDOMComponent(input, output, optionsForKanbanPlusPlusGeneralStandard);
}

function getAddressInputValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputAddressDefault).value;
}

function getPrivateKeySchnorr() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputSchnorrSignature.privateKey).value;
}

function getPrivateKeysAggregateSignatureNumberOfKeysValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputAggregateSignature.numberOfPrivateKeysToGenerate).value;
}

function getPrivateKeysAggregateSignatureInputValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputAggregateSignature.privateKeys).value;
}

function getPrivateKeysAggregateSignatureInputBase64() {
  return Buffer.from(getPrivateKeysAggregateSignatureInputValue()).toString('base64');
}

function getNonceAggreagateValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputAggregateSignature.nonces).value;
}

function getNoncesAggregateBase64() {
  return Buffer.from(getNonceAggreagateValue()).toString('base64');
}

function getSolutionsBase64() {
  return Buffer.from(document.getElementById(ids.defaults.kanbanPlusPlus.inputAggregateSignature.solutions).value).toString('base64');
}

function getSignatureSchnorrValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputSchnorrSignature.signature).value;
}

function getAggregateSignatureValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputAggregateSignature.theAggregation).value;
}

function getPublicKeySchnorrValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputSchnorrSignature.publicKey).value;
}

function getAggregateSignaturePublicKeysValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputAggregateSignature.publicKeys).value;
}

function getAggregateSignaturePublicKeysBase64() {
  return Buffer.from(getAggregateSignaturePublicKeysValue()).toString('base64');
}

function getCommitmentsBase64() {
  return Buffer.from(document.getElementById(ids.defaults.kanbanPlusPlus.inputAggregateSignature.commitments).value).toString('base64');
}

function getCommittedSignersBitmap() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputAggregateSignature.committedSignersBitmap).value.toString();
}

function getMessageDigest() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputAggregateSignature.messageDigest).value;
}

function getAggregatePublicKey() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputAggregateSignature.aggregatePubkey).value;
}

function getAggregateCommitment() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputAggregateSignature.aggregateCommitment).value;
}

function getSchnorrMessageValue() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputSchnorrSignature.messageToSha3).value;
}

function getSchnorrMessageBase64() {
  return Buffer.from(getSchnorrMessageValue()).toString('base64');
}

function getAggregateSignatureMessageBase64() {
  return Buffer.from(document.getElementById(ids.defaults.kanbanPlusPlus.inputAggregateSignature.message).value).toString('base64');
}

function getNonceValueSchnorr() {
  return document.getElementById(ids.defaults.kanbanPlusPlus.inputSchnorrSignature.nonce).value;
}

function hasEmptyValue(id) {
  return document.getElementById(id).value === null || document.getElementById(id).value === "";
}

function highlightRedIfEmpty(idsToCheck) {
  var isGood = true;
  for (var counterIds = 0; counterIds < idsToCheck.length; counterIds ++) {
    if (hasEmptyValue(idsToCheck[counterIds])) {
      submitRequests.highlightError(idsToCheck[counterIds]);
      isGood = false;
    } else {
      submitRequests.highlightInput(idsToCheck[counterIds]);
    }
  }
  return isGood;
}

function callbackDumpPrivateKey(input, output) {
  submitRequests.updateInnerHtml(ids.defaults.kanbanPlusPlus.inputSchnorrSignature.privateKey, miscellaneous.removeQuotes(input));
}

function callbackPublicKeyFromPrivate(input, output) {
  var result;
  try {
    result = JSON.parse(input).result;
  } catch (e) {
    result = miscellaneous.removeQuotes(input);
  }
  submitRequests.updateInnerHtml(ids.defaults.kanbanPlusPlus.inputSchnorrSignature.publicKey, result);
}

function callbackSha3(input, output) {
  submitRequests.updateInnerHtml(ids.defaults.kanbanPlusPlus.inputSchnorrSignature.outputSha3DigestDefault, miscellaneous.removeQuotes(input));
}

function dumpPrivateKey() {
  highlightRedIfEmpty([
    ids.defaults.kanbanPlusPlus.inputAddressDefault
  ]);
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCallsKanban.dumpPrivateKey.rpcCall, {
      net: globals.mainPage().getRPCKanbanNetworkOption(),
      address: getAddressInputValue()
    }, true),
    progress: globals.spanProgress(),
    result : document.getElementById(ids.defaults.inputSendPrivateKey),
    callback: callbackDumpPrivateKey
  });  
}

function testSha3() {
  highlightRedIfEmpty([
    ids.defaults.kanbanPlusPlus.inputSchnorrSignature.messageToSha3
  ]);
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCallsKanban.testSha3.rpcCall, {
      net: globals.mainPage().getRPCKanbanNetworkOption(),
      message: getSchnorrMessageBase64()
    }, true),
    progress: globals.spanProgress(),
    result : document.getElementById(ids.defaults.kanbanPlusPlus.inputSchnorrSignature.messageToSha3),
    callback: callbackSha3
  });  
}

function testSchnorrSignatureVerify() {
  highlightRedIfEmpty([
    ids.defaults.kanbanPlusPlus.inputSchnorrSignature.signature,
    ids.defaults.kanbanPlusPlus.inputSchnorrSignature.publicKey,
    ids.defaults.kanbanPlusPlus.inputSchnorrSignature.messageToSha3
  ]);
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCallsKanban.testSchnorrSignatureVerify.rpcCall, {
      net: globals.mainPage().getRPCKanbanNetworkOption(),
      signature: getSignatureSchnorrValue(),
      publicKey: getPublicKeySchnorrValue(),
      message: getSchnorrMessageBase64(),
    }, true),
    progress: globals.spanProgress(),
    result : document.getElementById(ids.defaults.kanbanPlusPlus.outputKanbanPlusPlusSecond),
    callback: callbackKanbanPlusPlusSignatureVerification
  });  
}

function testSchnorrSignature() {
  highlightRedIfEmpty([
    ids.defaults.kanbanPlusPlus.inputSchnorrSignature.privateKey, 
    ids.defaults.kanbanPlusPlus.inputSchnorrSignature.messageToSha3,
    ids.defaults.kanbanPlusPlus.inputSchnorrSignature.nonce
  ]);
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCallsKanban.testSchnorrSignature.rpcCall, {
      net: globals.mainPage().getRPCKanbanNetworkOption(),
      privateKey: getPrivateKeySchnorr(),
      message: getSchnorrMessageBase64(),
      nonce: getNonceValueSchnorr()
    }, true),
    progress: globals.spanProgress(),
    result : document.getElementById(ids.defaults.kanbanPlusPlus.outputKanbanPlusPlusSecond),
    callback: callbackSchnorrSign
  });  
}

function updatePageFromRadioButtonsByName(desiredRadioButtonName) {
  var theRadioButtons = document.getElementsByName(desiredRadioButtonName);
  for (var counterRadioButtons = 0; counterRadioButtons < theRadioButtons.length; counterRadioButtons ++) {
    var currentRadioButton = theRadioButtons[counterRadioButtons];
    if (currentRadioButton.checked) { 
      var event = new Event('change');
      currentRadioButton.dispatchEvent(event);
      return;
    }
  }
}

function updateKanbanPlusPlus() {
  updatePageFromRadioButtonsByName(ids.defaults.radioGroups.kanbanPlusPlusGeneral);
}

function getReceivedByAddress() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCallsKanban.listReceivedByAddress.rpcCall, {
      net: globals.mainPage().getRPCKanbanNetworkOption(),
    }, true),
    progress: globals.spanProgress(),
    result : ids.defaults.kanbanPlusPlus.outputKanbanPlusPlusGeneral,
    callback: callbackKanbanPlusPlusGeneralStandard
  });  
}

function callbackSchnorrSign(input, output) {
  var transformer = new jsonToHtml.JSONTransformer();
  transformer.writeJSONtoDOMComponent(input, output, optionsForKanbanPlusPlusGeneralStandard);
  var inputParsed = JSON.parse(input);
  submitRequests.updateInnerHtml(ids.defaults.kanbanPlusPlus.inputSchnorrSignature.signature, inputParsed.signatureSchnorrBase58);
  submitRequests.updateInnerHtml(ids.defaults.kanbanPlusPlus.inputSchnorrSignature.nonce, inputParsed.nonceSchnorrBase58Check);  
}




function testAggregateSignatureInitialize() {
  
  highlightRedIfEmpty([
    ids.defaults.kanbanPlusPlus.inputAggregateSignature.numberOfPrivateKeysToGenerate
  ]);
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(
      pathnames.rpcCallsKanban.testAggregateSignatureInitialize.rpcCall, {
        net: globals.mainPage().getRPCKanbanNetworkOption(),
        numberOfPrivateKeysToGenerate: getPrivateKeysAggregateSignatureNumberOfKeysValue()
      }, 
      true
    ),
    progress: globals.spanProgress(),
    result : ids.defaults.kanbanPlusPlus.divKanbanPlusPlusOutputThird,
    callback: callbackKanbanPlusPlusAggregateSignatureInitialize
  });    
}



function testAggregateSignatureChallenge() {
  highlightRedIfEmpty([
    ids.defaults.kanbanPlusPlus.inputAggregateSignature.committedSignersBitmap,
    ids.defaults.kanbanPlusPlus.inputAggregateSignature.commitments,
  ]);
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(
      pathnames.rpcCallsKanban.testAggregateSignatureChallenge.rpcCall, {
        net: globals.mainPage().getRPCKanbanNetworkOption(),
        committedSignersBitmap: getCommittedSignersBitmap(),
        commitments: getCommitmentsBase64()
      }, 
      true
    ),
    progress: globals.spanProgress(),
    result : ids.defaults.kanbanPlusPlus.divKanbanPlusPlusOutputThird,
    callback: callbackKanbanPlusPlusAggregateSignatureChallenge
  });
}

function testAggregateSignatureSolutions() {
  highlightRedIfEmpty([
    ids.defaults.kanbanPlusPlus.inputAggregateSignature.messageDigest
  ]);

  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(
      pathnames.rpcCallsKanban.testAggregateSignatureSolutions.rpcCall, {
        net: globals.mainPage().getRPCKanbanNetworkOption(),
        committedSignersBitmap: getCommittedSignersBitmap(),
        messageDigest: getMessageDigest(),
        aggregateCommitment: getAggregateCommitment(),
        aggregatePublicKey: getAggregatePublicKey()
      }, 
      true
    ),
    progress: globals.spanProgress(),
    result : ids.defaults.kanbanPlusPlus.divKanbanPlusPlusOutputThird,
    callback: callbackKanbanPlusPlusAggregateSignatureSolutions
  });    
}

function testAggregateSignatureVerify() {
  highlightRedIfEmpty([
    ids.defaults.kanbanPlusPlus.inputAggregateSignature.theAggregation,
    ids.defaults.kanbanPlusPlus.inputAggregateSignature.committedSignersBitmap,
    ids.defaults.kanbanPlusPlus.inputAggregateSignature.publicKeys,
    ids.defaults.kanbanPlusPlus.inputAggregateSignature.message
  ]);
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(
      pathnames.rpcCallsKanban.testAggregateSignatureVerification.rpcCall, {
        net: globals.mainPage().getRPCKanbanNetworkOption(),
        signature: getAggregateSignatureValue(),
        committedSignersBitmap: getCommittedSignersBitmap(),
        publicKeys: getAggregateSignaturePublicKeysBase64(),
        message: getAggregateSignatureMessageBase64()
      }, 
      true 
    ),
    progress: globals.spanProgress(),
    result : ids.defaults.kanbanPlusPlus.divKanbanPlusPlusOutputThird,
    callback: callbackKanbanPlusPlusAggregateVerification
  });    
}

function testAggregateSignatureAggregateSolutions() {
  highlightRedIfEmpty([
    ids.defaults.kanbanPlusPlus.inputAggregateSignature.solutions
  ]);
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(
      pathnames.rpcCallsKanban.testAggregateSignatureAggregation.rpcCall, {
        net: globals.mainPage().getRPCKanbanNetworkOption(),
        solutions: getSolutionsBase64(),
      }, 
      true
    ),
    progress: globals.spanProgress(),
    result : ids.defaults.kanbanPlusPlus.divKanbanPlusPlusOutputThird,
    callback: callbackKanbanPlusPlusAggregateFinalSolution
  });    
}

function testAggregateSignatureCommit() {
  highlightRedIfEmpty([
    ids.defaults.kanbanPlusPlus.inputAggregateSignature.privateKeys,
    ids.defaults.kanbanPlusPlus.inputAggregateSignature.nonces
  ]);
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(
      pathnames.rpcCallsKanban.testAggregateSignatureCommitment.rpcCall, {
        net: globals.mainPage().getRPCKanbanNetworkOption(),
        message: getAggregateSignatureMessageBase64(),
        nonces: getNoncesAggregateBase64(),
      }, 
      true
    ),
    progress: globals.spanProgress(),
    result : ids.defaults.kanbanPlusPlus.divKanbanPlusPlusOutputThird,
    callback: callbackKanbanPlusPlusAggregateSignatureCommit
  });    
}

function testPublicKeyFromPrivate() {
  highlightRedIfEmpty([ids.defaults.kanbanPlusPlus.inputSchnorrSignature.privateKey]);
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(
      pathnames.rpcCallsKanban.testPublicKeyGeneration.rpcCall, {
        net: globals.mainPage().getRPCKanbanNetworkOption(),
        privateKey: getPrivateKeySchnorr()
      }, 
      true
    ),
    progress: globals.spanProgress(),
    result : ids.defaults.kanbanPlusPlus.outputKanbanPlusPlusGeneral,
    callback: callbackPublicKeyFromPrivate
  });  
}

function setNet(netName) {
  var thePage = globals.mainPage();
  thePage.currentKanbanNetworkName = netName;
  thePage.storePageSettings(); 
  var radioId = thePage.kanbanNetworkRadioIds[netName];
  document.getElementById(radioId).checked = true;
  updateKanbanPlusPlus();
}

function setMainKanban() {
  setNet(pathnames.networkDataKanban.mainKanban.name);
}

function setTestKanban() {
  setNet(pathnames.networkDataKanban.testKanban.name);
}

module.exports = {
  updateKanbanPlusPlus,
  getReceivedByAddress,
  setTestKanban,
  setMainKanban,
  setAddress,
  setNonceSchnorr,
  setSignatureSchnorr,
  dumpPrivateKey,
  testPublicKeyFromPrivate,
  testSha3,
  testSchnorrSignature,
  testSchnorrSignatureVerify,
  testAggregateSignatureInitialize,
  testAggregateSignatureCommit,
  testAggregateSignatureChallenge,
  testAggregateSignatureSolutions,
  testAggregateSignatureAggregateSolutions,
  testAggregateSignatureVerify
}