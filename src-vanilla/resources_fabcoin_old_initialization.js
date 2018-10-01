"use strict";

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
  if (!(theCallLabel in fabcoinInitializationProcedures)) {
    errors.push(`Uknown or non-implemented rpc command: ${theCallLabel}.`);
    return null;
  }
  var theInitCall = fabcoinInitializationProcedures[theCallLabel];

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