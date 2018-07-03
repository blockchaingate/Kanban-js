"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
//const Block = require('../bitcoinjs_src/block');
const globals = require('./globals');
const miscellaneous = require('../miscellaneous');
const chartJS = require('chart.js');

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
  this.memoryPoolArrivalTimes = null;
  this.chartMemoryPoolArrivalTimes = null;
  this.chartId = "";
}

MyNode.prototype.generateMemoryPoolArrivalTimeChart = function(outputComponent) {
  if (typeof outputComponent === "string") {
    outputComponent = document.getElementById(outputComponent);
  }
  var localArrivalTimes = window.kanban.profiling.memoryPoolArrivalTimes.arrivals;
  var commonArrivalTimes = [];
  var numArrivalsLocalOnly = 0;
  var numArrivalsRemoteOnly = 0;
  for (var label in this.memoryPoolArrivalTimes) {
    if (label in localArrivalTimes) {
      commonArrivalTimes.push(this.memoryPoolArrivalTimes[label] - localArrivalTimes[label])
    } else  {
      numArrivalsRemoteOnly ++;
    }
  }
  for (var label in localArrivalTimes) {
    if (!(label in this.memoryPoolArrivalTimes)) {
      numArrivalsLocalOnly ++;
    }
  }
  if (this.chartMemoryPoolArrivalTimes !== null) {
    this.chartMemoryPoolArrivalTimes.destroy();
  }
  this.chartId = `ChartArrivalTimes${this.ipAddress}`;

  var result = `<span style= 'display:inline-block; height:400px; width:400px;'><canvas id="${this.chartId}"> </canvas></span>`;
  result += `<br>Num arrivals local only: ${numArrivalsLocalOnly} <br>`;
  result += `<br>Num arrivals remote only: ${numArrivalsRemoteOnly}`;
  result += `<br>common arrivals: ${commonArrivalTimes.join(", ")}`;
  outputComponent.innerHTML = result;

  var numBuckets = 50;
  var data = new Array(numBuckets ).fill(0);
  var labels = new Array(numBuckets).fill("");;
  //data[0] = numArrivalsRemoteOnly;
  //labels[0] = "remote only";
  //data[numBuckets + 1] = numArrivalsLocalOnly;
  //labels[numBuckets + 1] = "local only";
  var max = 0; 
  var min = 0;
  for (var counter = 0; counter < commonArrivalTimes.length; counter ++ ) {
    max = Math.max(max, commonArrivalTimes[counter]);
    min = Math.min(min, commonArrivalTimes[counter]);
  }
  var intervalLength = max - min;
  var bucketLength = intervalLength / numBuckets;
  for (var counter = 0; counter < numBuckets; counter ++) {
    var midPoint = Math.round( min + (counter + 0.5) * bucketLength);
    labels[counter ] = ` ${midPoint}`;
  }
  for (var counter = 0; counter < commonArrivalTimes.length; counter ++ ) {
    var currentDelay = commonArrivalTimes[counter];
    var bucketIndex = Math.floor( (currentDelay - min) / bucketLength);
    if (bucketIndex < 0) {
      bucketIndex = 0;
    }
    if (bucketIndex >= numBuckets) {
      bucketIndex = numBuckets - 1;
    }
    data[bucketIndex ] ++;
  }

  var theChart = document.getElementById(this.chartId);
  var ctx = theChart.getContext('2d'); 
  var colors = new Array(commonArrivalTimes.length).fill('lightskyblue', 0, commonArrivalTimes.length);
  var colorBorders = new Array(commonArrivalTimes.length).fill('skyblue', 0, commonArrivalTimes.length);

  this.chartMemoryPoolArrivalTimes = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: labels,
        datasets: [{
            label: 'mempool arrival times ms',
            data: data,
            backgroundColor: colors,
            borderColor: colorBorders,
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }]
        }
    }
  });
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
<button class = "buttonStandard" onclick = "window.kanban.allMyNodes.browserToOneRemoteNodeMiningInfo('${this.name}')">mine info</button>
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
<button class = "buttonStandard" onclick = "window.kanban.allMyNodes.sshNodeToOneRemoteMachineDeleteFabcoinConfiguration('${this.name}')">del .fab</button>
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
  if (window.kanban.profiling.memoryPoolArrivalTimes === null) {
    jsonToHtml.writeJSONtoDOMComponent(input, outputSpan, {});
    return;
  }
  try {
    currentNode.memoryPoolArrivalTimes = JSON.parse(input).arrivals;
    currentNode.generateMemoryPoolArrivalTimeChart(output);
  } catch (e) {
    jsonToHtml.writeJSONtoDOMComponent(`Failed to interpret memory pool arrival times. ${e}`, outputSpan, {});
  }
  //console.log(`${currentNode.name}: ${currentNode.ipAddress} `);
  //console.log("DEBUG input: " + input);
  //console.log("DEBUG output: " + output);
}

function callbackWriteBrowserToRemoteResult(input, output) {
  var allMyNodes = window.kanban.allMyNodes;
  var currentNode = allMyNodes.myNodes[allMyNodes.myNodesBrowserToRemoteResult[output]];
  var outputSpan = document.getElementById(output);
  jsonToHtml.writeJSONtoDOMComponent(input, outputSpan, {});
}

function callbackWriteBrowserRemotePingResult(input, output) {
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

MyNodesContainer.prototype.browserToAllRemoteMiningInfo = function () {
  for (var currentNodeLabel in this.myNodes) {
    this.browserToOneRemoteNodeMiningInfo(currentNodeLabel);
  }
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
    this.sshNodeToOneRemoteMachineGitPullMakeFab(currentNodeLabel);
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

MyNodesContainer.prototype.browserToOneRemoteNodeMiningInfo = function(currentNodeLabel) {
  var currentNode = this.myNodes[currentNodeLabel];
  currentNode.timeStart.pingBrowserToNode = (new Date()).getTime();
  var uri = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getMiningInfo.rpcCall, {
    net: globals.mainPage().getRPCNetworkOption(),
  });

  submitRequests.submitGET({
    url: currentNode.getURLBrowserToOneRemote(uri),
    progress: currentNode.getSpanBrowserToRemoteProgressId(),
    result : currentNode.getSpanBrowserToRemoteResultId(),
    callback: callbackWriteBrowserToRemoteResult    
  });

}

MyNodesContainer.prototype.browserToOneRemoteNodePing = function(currentNodeLabel) {
  var currentNode = this.myNodes[currentNodeLabel];
  currentNode.timeStart.pingBrowserToNode = (new Date()).getTime();
  submitRequests.submitGET({
    url: currentNode.getURLPingBrowserToNode(),
    progress: currentNode.getSpanBrowserToRemoteProgressId(),
    result : currentNode.getSpanBrowserToRemoteResultId(),
    callback: callbackWriteBrowserRemotePingResult        
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