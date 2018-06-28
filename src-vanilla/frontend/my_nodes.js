"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
//const Block = require('../bitcoinjs_src/block');
const globals = require('./globals');
const miscellaneous = require('../miscellaneous');

function MyNode(inputName, inputParsed) {
  this.name = inputName;
  this.ipAddress = inputParsed.ipAddress;
  this.sshKey = inputParsed.sshKey;
  this.sshKeySameAs = inputParsed.sshKeySameAs;
  this.user = inputParsed.user;
  this.timeStart = {
    pingBrowserToNode: null,
    sshNodeToRemoteMachine: null
  };
  this.timeEnd = {
    pingBrowserToNode: null,
    sshNodeToRemoteMachine: null
  };
}

MyNode.prototype.getURLBrowserToOneRemote = function (inputURI) {
  return `https://${this.ipAddress}:${pathnames.ports.https}${inputURI}`;
}

MyNode.prototype.getURLPingBrowserToNode = function () {
  return `https://${this.ipAddress}:${pathnames.ports.https}${pathnames.url.known.ping}`;
}

MyNode.prototype.getSpanBrowserToRemoteProgressId = function () {
  return `SpanBrowserToRemoteProgress${this.ipAddress}`;
}

MyNode.prototype.getSpanBrowserToRemoteResultId = function () {
  return `SpanBrowserToRemoteStats${this.ipAddress}`;
}

MyNode.prototype.getSpanNodeToRemoteMachineProgressId = function () {
  return `SpanNodeToRemoteMachineProgress${this.ipAddress}`;
}

MyNode.prototype.getSpanNodeToRemoteMachineResultId = function () {
  return `SpanNodeToRemoteMachineResult${this.ipAddress}`;
}

MyNode.prototype.toHTMLasTRelement = function () {
  var result = "";
  result += "<tr>";
  result += `<td>${this.name}</td>`
  result += `<td>
<a href = 'https://${this.ipAddress}:${pathnames.ports.https}' target = "_blank">https://${this.ipAddress}:${pathnames.ports.https}</a>
</td>`;
  result += `<td>
<a href = 'https://${this.ipAddress}:${pathnames.ports.https}${pathnames.url.known.logFileTestNetNoDNSSession}' 
 target = "_blank">
testnet log
</a></td>`;
  result += `<td>
<button class = "buttonStandard" onclick = "window.kanban.allMyNodes.browserToOneRemoteNodePing('${this.name}')">ping</button>
<button class = "buttonStandard" onclick = "window.kanban.allMyNodes.browserToOneRemoteNodeMempoolArrivalTimes('${this.name}')">mempool times</button>
</td>
`;
result += `<td>
<span id='${this.getSpanBrowserToRemoteProgressId()}'>?</span>
<span id='${this.getSpanBrowserToRemoteResultId()}'></span>
</td>`;
  result += `<td>
<button class = "buttonStandard" onclick = "window.kanban.allMyNodes.sshNodeToOneRemoteMachineGitPull('${this.name}')">update</button>
<button class = "buttonStandard" onclick = "window.kanban.allMyNodes.sshNodeToOneRemoteMachineNodeRestart('${this.name}')">restart</button>
<button class = "buttonStandard" onclick = "window.kanban.allMyNodes.sshNodeToOneRemoteMachineKillallFabcoind('${this.name}')">kill fab</button>
<button class = "buttonStandard" onclick = "window.kanban.allMyNodes.sshNodeToOneRemoteMachineDeleteFabcoinConfiguration('${this.name}')">del .fabcoin</button>
<button class = "buttonStandard" onclick = "window.kanban.allMyNodes.sshNodeToOneRemoteMachineGitPullMakeFab('${this.name}')">make fab</button>
<button class = "buttonStandard" onclick = "window.kanban.allMyNodes.sshNodeToOneRemoteMachineFabcoindStart('${this.name}')">start fab</button>
</td>`;
  result += `<td>
  <span id='${this.getSpanNodeToRemoteMachineProgressId()}'></span>
  <span id='${this.getSpanNodeToRemoteMachineResultId()}'></span>
</td>`;
  var sshKeyShortened = "not specified";
  if (typeof this.sshKey === "string") {
    sshKeyShortened = miscellaneous.shortenString(this.sshKey, 100);
  } else if (this.sshKeySameAs !== undefined) {
    sshKeyShortened = `Same as ${this.sshKeySameAs}`;
  }
  result += `<td>${this.user}</td><td>${sshKeyShortened}</td>`
  result += "</tr>";
  return result;
} 

function MyNodesContainer(inputJSON) {
  this.nodesRaw = JSON.parse(inputJSON).myNodes;
  this.myNodes = {};
  this.myNodesBrowserToRemoteResult = {};
  this.myNodesNodeToRemoteMachine = {};
  this.nodeNamesOrdered = [];
  for (var currentName in this.nodesRaw) {
    var currentNodeRaw = this.nodesRaw[currentName];
    this.myNodes[currentName] = new MyNode(currentName, currentNodeRaw);
    this.myNodesBrowserToRemoteResult[this.myNodes[currentName].getSpanBrowserToRemoteResultId()] = currentName;
    this.myNodesNodeToRemoteMachine[this.myNodes[currentName].getSpanNodeToRemoteMachineResultId()] = currentName;
    this.nodeNamesOrdered.push(currentName);
  }
}

MyNodesContainer.prototype.toHTML = function () {
  var result = "";
  result += "<table class = 'tableJSON'>";
  result += `<tr>
<th>name</th>
<th>ip address</th>
<th>log</th>
<th>browser &#8644; remote nodejs</th>
<th><span id = '${ids.defaults.SpanBrowserToRemoteColumnHeader}'>result</span></th>
<th>node local &#8644; remote machine</th>
<th><span>result</span></th>
<th>user</th>
<th>ssh key</th>
</tr>`;
  for (var counterNode = 0; counterNode < this.nodeNamesOrdered.length; counterNode ++) {
    var currentNode = this.myNodes[this.nodeNamesOrdered[counterNode]];
    result += currentNode.toHTMLasTRelement();
  }
  result += "</table>";
  return result;
}

function callbackBrowserToRemoteMempoolArrivalTimes(input, output) {
  var allMyNodes = window.kanban.allMyNodes;
  var currentNode = allMyNodes.myNodes[allMyNodes.myNodesBrowserToRemoteResult[output]];
  var outputSpan = document.getElementById(output);
  jsonToHtml.writeJSONtoDOMComponent(input,outputSpan, {});
  //console.log(`${currentNode.name}: ${currentNode.ipAddress} `);
  //console.log("DEBUG input: " + input);
  //console.log("DEBUG output: " + output);
}

function callbackWriteBrowserToRemoteResult(input, output) {
  var allMyNodes = window.kanban.allMyNodes;
  var currentNode = allMyNodes.myNodes[allMyNodes.myNodesBrowserToRemoteResult[output]];
  var outputSpan = document.getElementById(output);
  currentNode.timeEnd.pingBrowserToNode = (new Date()).getTime(); 
  var timeElapsed = currentNode.timeEnd.pingBrowserToNode - currentNode.timeStart.pingBrowserToNode;
  outputSpan.innerHTML = `${timeElapsed.toFixed(2)} ms`;
  //console.log(`${currentNode.name}: ${currentNode.ipAddress} `);
  //console.log("DEBUG input: " + input);
  //console.log("DEBUG output: " + output);
}

function callbackWriteNodeToRemoteResult(input, output) {
  var allMyNodes = window.kanban.allMyNodes;
  var currentNode = allMyNodes.myNodes[allMyNodes.myNodesNodeToRemoteMachine[output]];
  var outputSpan = document.getElementById(output);
  currentNode.timeEnd.sshNodeToRemoteMachine = (new Date()).getTime(); 
  var timeElapsed = (currentNode.timeEnd.sshNodeToRemoteMachine - currentNode.timeStart.sshNodeToRemoteMachine) / 1000;
  outputSpan.innerHTML = `${input}<br>${timeElapsed.toFixed(2)} s`;
  //console.log(`${currentNode.name}: ${currentNode.ipAddress} `);
  //console.log("DEBUG input: " + input);
  //console.log("DEBUG output: " + output);
}

MyNodesContainer.prototype.browserToAllRemoteMempoolArrivalTimes = function () {
  for (var currentNodeLabel in this.myNodes) {
    this.browserToOneRemoteNodeMempoolArrivalTimes(currentNodeLabel);
  }
}

MyNodesContainer.prototype.browserToAllRemoteNodePing = function () {
  for (var currentNodeLabel in this.myNodes) {
    this.browserToOneRemoteNodePing(currentNodeLabel);
  }
}

MyNodesContainer.prototype.sshNodeToAllRemoteMachineGitPull = function() {
  for (var currentNodeLabel in this.myNodes) {
    this.sshNodeToOneRemoteMachineGitPull(currentNodeLabel);
  }
}

MyNodesContainer.prototype.sshNodeToAllRemoteMachineKillallFabcoind = function() {
  for (var currentNodeLabel in this.myNodes) {
    this.sshNodeToOneRemoteMachineKillallFabcoind(currentNodeLabel);
  }
}

MyNodesContainer.prototype.sshNodeToAllRemoteMachineNodeRestart = function() {
  for (var currentNodeLabel in this.myNodes) {
    this.sshNodeToOneRemoteMachineNodeRestart(currentNodeLabel);
  }
}

MyNodesContainer.prototype.sshNodeToAllRemoteMachineFabcoindStart = function() {
  for (var currentNodeLabel in this.myNodes) {
    this.sshNodeToOneRemoteMachineFabcoindStart(currentNodeLabel);
  }
}

MyNodesContainer.prototype.sshNodeToAllRemoteMachineDeleteFabcoinConfiguration = function() {
  for (var currentNodeLabel in this.myNodes) {
    this.sshNodeToOneRemoteMachineDeleteFabcoinConfiguration(currentNodeLabel);
  }
}
 
MyNodesContainer.prototype.sshNodeToAllRemoteMachineGitPullMakeFab = function () {
  for (var currentNodeLabel in this.myNodes) {
    this.sshNodeToOneRemoteMachineDeleteFabcoinConfiguration(currentNodeLabel);
  }
}

MyNodesContainer.prototype.browserToOneRemoteNodeMempoolArrivalTimes = function(currentNodeLabel) {
  var currentNode = this.myNodes[currentNodeLabel];
  currentNode.timeStart.pingBrowserToNode = (new Date()).getTime();
  var uri = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getMemoryPoolArrivalTimes.rpcCall, {
    net: globals.mainPage().getRPCNetworkOption(),
  });

  submitRequests.submitGET({
    url: currentNode.getURLBrowserToOneRemote(uri),
    progress: currentNode.getSpanBrowserToRemoteProgressId(),
    result : currentNode.getSpanBrowserToRemoteResultId(),
    callback: callbackBrowserToRemoteMempoolArrivalTimes    
  });

}

MyNodesContainer.prototype.browserToOneRemoteNodePing = function(currentNodeLabel) {
  var currentNode = this.myNodes[currentNodeLabel];
  currentNode.timeStart.pingBrowserToNode = (new Date()).getTime();
  submitRequests.submitGET({
    url: currentNode.getURLPingBrowserToNode(),
    progress: currentNode.getSpanBrowserToRemoteProgressId(),
    result : currentNode.getSpanBrowserToRemoteResultId(),
    callback: callbackWriteBrowserToRemoteResult        
  });
}

MyNodesContainer.prototype.sshNodeToOneRemoteMachineGitPull = function(currentNodeLabel) {
  var currentNode = this.myNodes[currentNodeLabel];
  currentNode.timeStart.sshNodeToRemoteMachine = (new Date()).getTime();
  var theURL = pathnames.getURLFromMyNodesCall(pathnames.myNodesCommands.sshNodeToOneRemoteMachineGitPull.myNodesCommand, {
    machineName: currentNodeLabel
  });
  console.log(`DEBUG: name: ${currentNode.name}, start time: ${currentNode.timeStart.sshNodeToRemoteMachine}`);
  console.log("DEBUG: the url: " + theURL);
  submitRequests.submitGET({
    url: theURL,
    progress: currentNode.getSpanNodeToRemoteMachineProgressId(),
    result : currentNode.getSpanNodeToRemoteMachineResultId(),
    callback: callbackWriteNodeToRemoteResult        
  });
}

MyNodesContainer.prototype.sshNodeToOneRemoteMachineKillallFabcoind = function(currentNodeLabel) {
  var currentNode = this.myNodes[currentNodeLabel];
  currentNode.timeStart.sshNodeToRemoteMachine = (new Date()).getTime();
  var theURL = pathnames.getURLFromMyNodesCall(pathnames.myNodesCommands.sshNodeToOneRemoteMachineKillallFabcoind.myNodesCommand, {
    machineName: currentNodeLabel
  });
  console.log("DEBUG: the url: " + theURL);
  submitRequests.submitGET({
    url: theURL,
    progress: currentNode.getSpanNodeToRemoteMachineProgressId(),
    result : currentNode.getSpanNodeToRemoteMachineResultId(),
    callback: callbackWriteNodeToRemoteResult        
  });
}

MyNodesContainer.prototype.sshNodeToOneRemoteMachineDeleteFabcoinConfiguration = function(currentNodeLabel) {
  var currentNode = this.myNodes[currentNodeLabel];
  currentNode.timeStart.sshNodeToRemoteMachine = (new Date()).getTime();
  var theURL = pathnames.getURLFromMyNodesCall(pathnames.myNodesCommands.sshNodeToOneRemoteMachineDeleteFabcoinConfiguration.myNodesCommand, {
    machineName: currentNodeLabel
  });
  console.log("DEBUG: the url: " + theURL);
  submitRequests.submitGET({
    url: theURL,
    progress: currentNode.getSpanNodeToRemoteMachineProgressId(),
    result : currentNode.getSpanNodeToRemoteMachineResultId(),
    callback: callbackWriteNodeToRemoteResult        
  });
}

MyNodesContainer.prototype.sshNodeToOneRemoteMachineNodeRestart = function(currentNodeLabel) {
  var currentNode = this.myNodes[currentNodeLabel];
  currentNode.timeStart.sshNodeToRemoteMachine = (new Date()).getTime();
  var theURL = pathnames.getURLFromMyNodesCall(pathnames.myNodesCommands.sshNodeToOneRemoteMachineNodeRestart.myNodesCommand, {
    machineName: currentNodeLabel
  });
  //console.log(theURL);
  submitRequests.submitGET({
    url: theURL,
    progress: currentNode.getSpanNodeToRemoteMachineProgressId(),
    result : currentNode.getSpanNodeToRemoteMachineResultId(),
    callback: callbackWriteNodeToRemoteResult        
  });
}

MyNodesContainer.prototype.sshNodeToOneRemoteMachineFabcoindStart = function(currentNodeLabel) {
  var currentNode = this.myNodes[currentNodeLabel];
  currentNode.timeStart.sshNodeToRemoteMachine = (new Date()).getTime();
  var theURL = pathnames.getURLFromMyNodesCall(pathnames.myNodesCommands.sshNodeToOneRemoteMachineStartFabcoind.myNodesCommand, {
    machineName: currentNodeLabel,
    net: globals.mainPage().getRPCNetworkOption()
  });
  //console.log(theURL);
  submitRequests.submitGET({
    url: theURL,
    progress: currentNode.getSpanNodeToRemoteMachineProgressId(),
    result : currentNode.getSpanNodeToRemoteMachineResultId(),
    callback: callbackWriteNodeToRemoteResult        
  });
}

MyNodesContainer.prototype.sshNodeToOneRemoteMachineGitPullMakeFab = function(currentNodeLabel) {
  var currentNode = this.myNodes[currentNodeLabel];
  currentNode.timeStart.sshNodeToRemoteMachine = (new Date()).getTime();
  var theURL = pathnames.getURLFromMyNodesCall(pathnames.myNodesCommands.sshNodeToOneRemoteMachineGitPullMakeFab.myNodesCommand, {
    machineName: currentNodeLabel,
    net: globals.mainPage().getRPCNetworkOption()
  });
  //console.log(theURL);
  submitRequests.submitGET({
    url: theURL,
    progress: currentNode.getSpanNodeToRemoteMachineProgressId(),
    result : currentNode.getSpanNodeToRemoteMachineResultId(),
    callback: callbackWriteNodeToRemoteResult        
  });
}

MyNodesContainer.prototype.toHTMLWithDebug = function () {
  var result = "";
  result += this.toHTML();
  result += jsonToHtml.getHtmlFromArrayOfObjects(this.nodesRaw, {});
  return result;
}

function myNodesOutputCallback(input, outputComponent) {
  try {
    window.kanban.allMyNodes = new MyNodesContainer(input);
    var allMyNodes = window.kanban.allMyNodes;
    var result = "";
    result += allMyNodes.toHTML();
    outputComponent.innerHTML = result;
  } catch (e) {
    outputComponent.innerHTML = `Error: ${e}`;
    return;
  }
}

function getMyNodesOutput() { 
  return document.getElementById(ids.defaults.outputMyNodes);
}

function updateMyNodes() {
  var theURL = pathnames.getURLFromMyNodesCall(pathnames.myNodesCommands.fetchNodeInfo.myNodesCommand, {});
  submitRequests.submitGET({
    url: theURL,
    progress: globals.spanProgress(),
    result : getMyNodesOutput(),
    callback: myNodesOutputCallback
  });  
}

module.exports = {
  updateMyNodes
}