"use strict";



var computationalEngineCalls = {
  computeUnspentTransactions: {
    computationalEngineCall: "computeUnspentTransactions", // must be same as key label, used for autocomplete
  }, 
  pollOngoing: {
    computationalEngineCall: "pollOngoing" // must be same as key label, used for autocomplete
  },
  testGPUSha256: {
    computationalEngineCall: "testGPUSha256" // must be same as key label, used for autocomplete
  },
  testBackEndSha256Multiple: {
    computationalEngineCall: "testBackEndSha256Multiple" // must be same as key label, used for autocomplete
  },
  testBackEndSha256OneMessage: {
    computationalEngineCall: "testBackEndSha256OneMessage" // must be same as key label, used for autocomplete
  },
  testBackEndPipeMultiple: {
    computationalEngineCall: "testBackEndPipeMultiple" // must be same as key label, used for autocomplete
  },
  testBackEndPipeOneMessage: {
    computationalEngineCall: "testBackEndPipeOneMessage" // must be same as key label, used for autocomplete
  },
  testBackEndSignOneMessage: {
    computationalEngineCall: "testBackEndSignOneMessage" // must be same as key label, used for autocomplete
  },
  testBackEndSignMultipleMessages: {
    computationalEngineCall: "testBackEndSignMultipleMessages" // must be same as key label, used for autocomplete
  },
  testBackEndEngineSha256: {
    computationalEngineCall: "testBackEndEngineSha256" // must be same as key label, used for autocomplete
  }
};

var gpuCommands = {
  SHA256: "SHA256",
  testBuffer: "testBuffer",
  signOneMessage: "signOneMessage",
  verifyOneSignature: "verifyOneSignature"
};


var computationalEngineCall = "computationalEngineCall";

var computationalEngineCallStatuses = {
  starting: "Starting",
  recentlyFinished: "Recently finished",
  notFound: "Not found"
};

