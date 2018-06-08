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
}

MyNode.prototype.getPingURL = function () {
  return `http://${this.ipAddress}:${pathnames.ports.http}${pathnames.url.known.ping}`;
}

MyNode.prototype.getSpanPingId = function () {
  return `spanPing${this.ipAddress}`;
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
  result += `<td><span id='${this.getSpanPingId()}'>?</span></td>`;
  var sshKeyShortened = miscellaneous.shortenString(this.sshKey, 70);
  result += `<td>${this.user}</td><td>${sshKeyShortened}</td>`
  result += "</tr>";
  return result;
} 

function MyNodesContainer(inputJSON) {
  this.nodesRaw = JSON.parse(inputJSON).myNodes;
  this.myNodes = {};
  this.nodeNamesOrdered = [];
  for (var counterNodes = 0; counterNodes < this.nodesRaw.length; counterNodes ++) {
    var currentNodeRaw = this.nodesRaw[counterNodes];
    var currentName = currentNodeRaw.name;
    if (currentName in this.myNodes) {
      currentName += `ERROR: ${currentName} already listed as a node.`;
    }
    this.myNodes[currentName] = new MyNode(currentNodeRaw);
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
<th><span id = '${ids.defaults.spanPingColumnHeader}'>ping</span></th>
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

function emptyCallBack(input, output) {

}

MyNodesContainer.prototype.pingMyNodes = function () {
  for (var currentNodeLabel in this.myNodes) {
    var currentNode = this.myNodes[currentNodeLabel];
    submitRequests.submitGET({
      url: currentNode.getPingURL(),
      progress: currentNode.getSpanPingId(),
      result : null,
      callback: emptyCallBack        
    });
  }
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
  pingMyNodes
}