"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
//const Block = require('../bitcoinjs_src/block');
const globals = require('./globals');
const miscellaneous = require('../miscellaneous');

function MyNode(inputParsed) {
  this.name = inputParsed.name;
  this.ipAddress = inputParsed.ipAddress;
  this.sshKey = inputParsed.sshKey;
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

MyNode.prototype.getURLPingBrowserToNode = function () {
  return `http://${this.ipAddress}:${pathnames.ports.http}${pathnames.url.known.ping}`;
}

MyNode.prototype.getURLsshNodeToRemoteMachine = function () {
  return pathnames.getURLFromMyNodesCall(pathnames.myNodesCommands.sshNodeToRemoteMachineRestart.myNodesCommand, {
    machineName: this.name
  });
}

MyNode.prototype.getSpanBrowserToRemoteProgressId = function () {
  return `SpanBrowserToRemoteProgress${this.ipAddress}`;
}

MyNode.prototype.getSpanBrowserToRemoteStatsId = function () {
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
<a href = 'http://${this.ipAddress}:${pathnames.ports.http}' target = "_blank">${this.ipAddress}:${pathnames.ports.http}</a><br>
<a href = 'https://${this.ipAddress}:${pathnames.ports.https}' target = "_blank">https://${this.ipAddress}:${pathnames.ports.https}</a>
</td>`;
  result += `<td>
<a href = 'http://${this.ipAddress}:${pathnames.ports.http}${pathnames.url.known.logFileTestNetSession}' 
 target = "_blank">
testnet log
</a></td>`;
  result += `<td>
<button class = "buttonStandard" onclick = "window.kanban.myNodes.pingOneNode('${this.name}')">ping</button>
</td>
`;
result += `<td>
<span id='${this.getSpanBrowserToRemoteProgressId()}'>?</span>
<span id='${this.getSpanBrowserToRemoteStatsId()}'></span>
</td>`;
  result += `<td>
<button class = "buttonStandard" onclick = "window.kanban.myNodes.sshRedeployOneNode('${this.name}')">restart</button>
</td>`;
  result += `<td>
  <span id='${this.getSpanNodeToRemoteMachineProgressId()}'></span>
  <span id='${this.getSpanNodeToRemoteMachineResultId()}'></span>  
</td>`;
  var sshKeyShortened = miscellaneous.shortenString(this.sshKey, 70);
  result += `<td>${this.user}</td><td>${sshKeyShortened}</td>`
  result += "</tr>";
  return result;
} 

function MyNodesContainer(inputJSON) {
  this.nodesRaw = JSON.parse(inputJSON).myNodes;
  this.myNodes = {};
  this.myNodesPingStatSpans = {};
  this.nodeNamesOrdered = [];
  for (var counterNodes = 0; counterNodes < this.nodesRaw.length; counterNodes ++) {
    var currentNodeRaw = this.nodesRaw[counterNodes];
    var currentName = currentNodeRaw.name;
    if (currentName in this.myNodes) {
      currentName += `ERROR: ${currentName} already listed as a node.`;
    }
    this.myNodes[currentName] = new MyNode(currentNodeRaw);
    this.myNodesPingStatSpans[this.myNodes[currentName].getSpanBrowserToRemoteStatsId()] = currentName;
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

function callbackWritePingStats(input, output) {
  var currentNode = allMyNodes.myNodes[allMyNodes.myNodesPingStatSpans[output]];
  var outputSpan = document.getElementById(output);
  currentNode.timeEnd.pingBrowserToNode = (new Date()).getTime(); 
  var timeElapsed = currentNode.timeEnd.pingBrowserToNode - currentNode.timeStart.pingBrowserToNode;
  outputSpan.innerHTML = `${timeElapsed.toFixed(2)} ms`;
  //console.log(`${currentNode.name}: ${currentNode.ipAddress} `);
  //console.log("DEBUG input: " + input);
  //console.log("DEBUG output: " + output);
}

MyNodesContainer.prototype.pingMyNodes = function () {
  for (var currentNodeLabel in this.myNodes) {
    this.pingOneNode(currentNodeLabel);
  }
}

MyNodesContainer.prototype.pingOneNode = function(currentNodeLabel) {
  var currentNode = this.myNodes[currentNodeLabel];
  currentNode.timeStart.pingBrowserToNode = (new Date()).getTime();
  submitRequests.submitGET({
    url: currentNode.getURLPingBrowserToNode(),
    progress: currentNode.getSpanBrowserToRemoteProgressId(),
    result : currentNode.getSpanBrowserToRemoteStatsId(),
    callback: callbackWritePingStats        
  });
}

MyNodesContainer.prototype.sshRedeployOneNode = function(currentNodeLabel) {
  var currentNode = this.myNodes[currentNodeLabel];
  currentNode.timeStart.sshNodeToRemoteMachine = (new Date()).getTime();
  console.log(`DEBUG: name: ${currentNode.name}, start time: ${currentNode.timeStart.sshNodeToRemoteMachine}`);
  var theURL = currentNode.getURLsshNodeToRemoteMachine();
  console.log(theURL);
  //submitRequests.submitGET({
  //  url: currentNode.getURLPingBrowserToNode(),
  //  progress: currentNode.getSpanBrowserToRemoteProgressId(),
  //  result : currentNode.getSpanBrowserToRemoteStatsId(),
  //  callback: callbackWritePingStats        
  //});
}

MyNodesContainer.prototype.toHTMLWithDebug = function () {
  var result = "";
  result += this.toHTML();
  result += jsonToHtml.getHtmlFromArrayOfObjects(this.nodesRaw);
  return result;
}

var allMyNodes = null;

function pingMyNodes() {
  allMyNodes.pingMyNodes();
}

function sshRedeployOneNode(currentNodeLabel) {
  allMyNodes.sshRedeployOneNode(currentNodeLabel);
}

function pingOneNode(currentNodeLabel) {
  allMyNodes.pingOneNode(currentNodeLabel);
}

function myNodesOutputCallback(input, outputComponent) {
  try {
    allMyNodes = new MyNodesContainer(input);
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
  updateMyNodes,
  pingMyNodes,
  pingOneNode,
  sshRedeployOneNode
}