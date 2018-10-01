"use strict";

const pathnames = require('../../pathnames');
const fabcoinRPC = require('./rpc');

var networkRPCOption = fabcoinRPC.networkRPCOption;
var networkDataKanbanProofOfConcept = fabcoinRPC.networkDataKanbanProofOfConcept;
var networkData = fabcoinRPC.networkData;

//To be documented on request. Please email me/tell me in person if you want 
//me to document the structure below.
//Not doing it right away because I am still refactoring it heavily.  
var fabcoinInitializationProceduresOLD = {
  startFabcoind: {
    fabcoinInitialization: "startFabcoind", //must be same as label, used for autocomplete
    command: pathnames.pathname.fabcoind,
    allowedArgumentValues: {
      net: [networkRPCOption.regtest, networkRPCOption.testNetNoDNS, networkRPCOption.testNet],
      mine: ["", "-gen"]
    },
    cli: [ ["net", networkRPCOption.testNetNoDNS], ["mine", ""], "-daemon"] //when the argument is an array, the second is the default
  },
  startKanban: {
    fabcoinInitialization: "startKanban", //must be same as label, used for autocomplete
    command: pathnames.pathname.kanband,
    allowedArgumentValues: {
      net: [networkDataKanbanProofOfConcept.testKanban.rpcOption, networkDataKanbanProofOfConcept.mainKanban.rpcOption],
    },
    cli: [ 
      ["dataDir", null], //<- please keep this option first, it is referred to in initialize_fabcoin_folders
      ["net", networkRPCOption.testNetNoDNS], 
      "-gen", 
      "-printtoconsole", 
      "-logips", 
      "-daemon"      
    ] //when the argument is an array, the second is the default
  },
  killAll: {
    fabcoinInitialization: "killAll",
    command: "killall",
    cli: ["fabcoind"]
  },
  killAllKanbans: {
    fabcoinInitialization: "killAllKanbans",
    command: "killall",
    cli: ["fabcoind"]
  },
  gitPullNode: {
    fabcoinInitialization: "gitPullNode",
    command: "git",
    path: pathnames.path.base,
    cli: ["pull"]
  },
  gitPullFabcoin: {
    fabcoinInitialization: "gitPullFabcoin",
    command: "git",
    path: pathnames.path.fabcoin,
    cli: ["pull"]
  },
  gitPullKanban: {
    fabcoinInitialization: "gitPullKanban",
    command: "git",
    path: pathnames.path.kanbanProofOfConcept,
    cli: ["pull"]
  },
  makeFabcoin: {
    fabcoinInitialization: "makeFabcoin",
    command: "make",
    path: pathnames.path.fabcoin,
    cli: []
  },
  deleteFabcoinConfiguration: {
    fabcoinInitialization: "deleteFabcoinConfiguration",
    command: "rm",
    path: "fabcoinConfigurationFolder", //<- looked up from pathsComputedAtRunTime
    allowedArgumentValues: {
      folder: [networkData.regtest.folder, networkData.testNetNoDNS.folder]
    },
    cli: ["-r", ["folder", networkData.testNetNoDNS.folder]]
  }
};

function isAllowedArgumentForFabInitialization(theInitCall, theLabel, theValue, errors, callCollection) {
  if (theInitCall.allowedArgumentValues === undefined) {
    return true;
  }
  if (!(theLabel in theInitCall.allowedArgumentValues)) {
    return true;
  }
  var currentAllowedValues = theInitCall.allowedArgumentValues[theLabel];
  for (var counterAllowed = 0; counterAllowed < currentAllowedValues.length; counterAllowed ++) {
    if (theValue === currentAllowedValues[counterAllowed]) {
      return true;
    }
  }
  errors.push( 
    `Variable <b>${theLabel}</b> not allowed to take on value <b>${theValue}</b> in command <b>${theInitCall.fabcoinInitialization}</b>.
    The allowed values are ${currentAllowedValues.join(', ')}. `
  );
  return false;
}

function getFabcoinInitializationOLDCallArguments(theCallLabel, additionalArguments, errors) {
  //console.log("DEBUG: extracting additional arguments from: " + JSON.stringify(additionalArguments));
  var result = [];
  if (!(theCallLabel in fabcoinInitializationProceduresOLD)) {
    errors.push(`Uknown or non-implemented rpc command: ${theCallLabel}.`);
    return null;
  }
  var theInitCall = fabcoinInitializationProceduresOLD[theCallLabel];

  for (var counterCommand = 0; counterCommand < theInitCall.cli.length; counterCommand ++) {
    var currentArgument = theInitCall.cli[counterCommand];
    if (typeof currentArgument === "string") {
      result.push(currentArgument);
      continue;
    }
    var currentLabel = currentArgument[0];
    var currentValue = currentArgument[1];
    if (currentLabel in additionalArguments) {
      currentValue = additionalArguments[currentLabel];
    }
    if (!isAllowedArgumentForFabInitialization(theInitCall, currentLabel, currentValue, errors)) {
      return;
    }
    if (currentValue !== "" && typeof currentValue === "string") {
      result.push(currentValue);
    }
  }
  return result;
}

function getURLFromFabcoinInitializationOLD(theCallLabel, theArguments) {
  var theRequest = {};
  theRequest[fabcoinInitialization] = theCallLabel;
  for (var label in theArguments) {
    theRequest[label] = theArguments[label];
  }
  return `${url.known.fabcoinInitialization}?command=${encodeURIComponent(JSON.stringify(theRequest))}`;
}

function getURLFromMyNodesCall(theMyNodesCallLabel, theArguments) {
  var theRequest = {};
  theRequest[myNodesCommand] = theMyNodesCallLabel;
  var theMyNodesCall = myNodesCommands[theMyNodesCallLabel];
  if (theArguments === undefined) {
    theArguments = {};
  }
  for (var label in theArguments) {
    if (typeof theArguments[label] !== "string") {
      continue; // <- label not valid for this RPC call
    }
    if (!(label in theMyNodesCall.cli)) {
      console.log(`Warning: label: ${label} is not listed in the ${theMyNodesCallLabel}.cli object.`);
      continue;
    }
    if (typeof theArguments[label] === "string") {
      theRequest[label] = theArguments[label];
    } 
  }
  return `${url.known.myNodesCommand}?command=${encodeURIComponent(JSON.stringify(theRequest))}`;
}

var myNodesCommand = "myNodesCommand";

var myNodesCommands = {
  fetchNodeInfo: {
    myNodesCommand: "fetchNodeInfo", //must be same as label, used for autocomplete
  },
  sshNodeToOneRemoteMachineGitPull: {
    myNodesCommand: "sshNodeToOneRemoteMachineGitPull",
    cli: {
      machineName: null
    }
  },
  sshNodeToOneRemoteMachineDeleteFabcoinConfiguration: {
    myNodesCommand: "sshNodeToOneRemoteMachineDeleteFabcoinConfiguration",
    cli: {
      machineName: null,
      net: null
    }
  },
  sshNodeToOneRemoteMachineKillallFabcoind: {
    myNodesCommand: "sshNodeToOneRemoteMachineKillallFabcoind",
    cli: {
      machineName: null
    }
  },
  sshNodeToOneRemoteMachineNodeRestart: {
    myNodesCommand: "sshNodeToOneRemoteMachineNodeRestart",
    cli: {
      machineName: null
    }    
  },
  sshNodeToOneRemoteMachineStartFabcoind: {
    myNodesCommand: "sshNodeToOneRemoteMachineStartFabcoind",
    cli: {
      machineName: null,
      net: null
    }    
  },
  sshNodeToOneRemoteMachineGitPullMakeFab: {
    myNodesCommand: "sshNodeToOneRemoteMachineGitPullMakeFab",
    cli: {
      machineName: null
    }    
  },
};

module.exports = {
  myNodesCommands,
  getURLFromFabcoinInitializationOLD
}