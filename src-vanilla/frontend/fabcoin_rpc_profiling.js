"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
const globals = require('./globals');
const RPCGeneral = require('./fabcoin_rpc_general');
const escapeHTML = require('escape-html');
const chartJS = require('chart.js');

function callbackMemoryPoolArrivals(input, outputComponent) {
  try {
    window.kanban.profiling.memoryPoolArrivalTimes = JSON.parse(input);
  } catch (e) {
    console.log(`Error while parsing memory pool arrivals. ${e}`);
  }
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent, {});
}

function callbackProfilingStandard(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent, {});
}

function getOutputProfilingStandard() {
  return document.getElementById(ids.defaults.outputProfiling);
}

function getMemoryInfo() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getMemoryInfo.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
    }),
    progress: globals.spanProgress(),
    result : getOutputProfilingStandard(),
    callback: callbackProfilingStandard
  });  
}

function getInfo() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getInfo.rpcCall, {
      net: globals.mainPage().getRPCNetworkOption(),
    }),
    progress: globals.spanProgress(),
    result : getOutputProfilingStandard(),
    callback: callbackProfilingStandard
  });  
}

function getThreadTable(inputParsed) {
  var result = "";
  result += "<table><tr><th></th><th>threads</th></tr>"
  for (var counterThread = 0; counterThread < inputParsed.threads.length; counterThread ++) {
    result += `<tr><td>${counterThread}</td><td>${inputParsed.threads[counterThread]}</td></tr>`;
  }
  result += "</table>";
  return result;
}

function showStatistics(inputLabel) {
  var stats = window.kanban.profiling.statistics[inputLabel];
  if (window.kanban.profiling.chart !== undefined) {
    window.kanban.profiling.chart.destroy();
  }
  var theChart = document.getElementById("chartProfiling");
  var ctx = theChart.getContext('2d'); 
  var inputDescriptions = stats.runTime.histogram.bucketDescriptions;
  var content = stats.runTime.histogram.histogramContent;
  var finalLabels = [];
  var data = [];
  for (var indexBucket in inputDescriptions) {
    var currentBucket = inputDescriptions[indexBucket];
    if (currentBucket.length === 2) {
      var left = currentBucket[0];
      if (left === - 1)
        left = 0; 
      finalLabels.push(`(${left}, ${currentBucket[1]}]`);
    } else {
      finalLabels.push(`(${currentBucket[0]}, \u221E)`);      
    }
    data.push(content[indexBucket]);
  }
  var colors = new Array(data.length).fill('lightskyblue', 0, data.length);
  var colorBorders = new Array(data.length).fill('skyblue', 0, data.length);
  window.kanban.profiling.chart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: finalLabels,
        datasets: [{
            label: 'run time \u03BCs',
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

function getGraphsTable(inputParseD) {
  var result = "";
  var stats = window.kanban.profiling.statistics;
  result += "<table class = 'tableProfiling'><tr><th>Function</th><th>Number of calls</th><th>Avg. run time (microseconds)</th><th>Run time excl. subordinates</th></tr>";
  var theStats = inputParseD.functionStats;
  for (var label in theStats) {
    var encodedLabel = encodeURIComponent(label);
    stats[encodedLabel] = theStats[label];
    var currentStats = stats[encodedLabel];
    result += "<tr>";
    if (currentStats.runTime.histogram !== undefined && currentStats.runTime.histogram !== null) {
      result += `<td><a href = "#${encodedLabel}" onclick = "window.kanban.rpc.profiling.showStatistics('${encodedLabel}')"> ${escapeHTML(label)}</a></td>`
    } else {
      result += `<td>${escapeHTML(label)}</td>`;
    }
    var numberOfSamples = currentStats.runTime.numberOfSamples;
    result += `<td>${numberOfSamples}</td>`;
    var averageRunTime = currentStats.runTime.totalRunTime;
    averageRunTime /= numberOfSamples;
    averageRunTime = averageRunTime.toFixed(0);
    result += `<td>${averageRunTime} &#956;s</td>`;
    if (currentStats.runTimeSubordinates != undefined && currentStats.runTimeSubordinates !== null) {
      var averageRunTimeExcludingSubordinates = currentStats.runTimeExcludingSubordinatesInMicroseconds;
      averageRunTimeExcludingSubordinates /= numberOfSamples;
      averageRunTimeExcludingSubordinates = averageRunTimeExcludingSubordinates.toFixed(0);
      result += `<td>${averageRunTimeExcludingSubordinates} &#956;s</td>`;
    }
    result += "</tr>";
  }
  result += "</table>";
  return result;
}

function callbackGetPerformanceProfilePartTwo(input, outputDOM) {
  var inputParsed = JSON.parse(input);
  var result = "";
  result += submitRequests.getToggleButtonPausePolling({label: "raw", content: JSON.stringify(input)});
  result += jsonToHtml.getClearParentButton();
  result += "<table><tr><td>";
  result += getGraphsTable(inputParsed);
  result += "</td><td>";
  result += "<span style= 'display:inline-block; height:400px; width:400px;'><canvas id = 'chartProfiling' style = 'height: 400px; width: 400px;'></canvas></span>";
  result += "</td></tr></table>";
  result += getThreadTable(inputParsed);
  //result += jsonToHtml.getHtmlFromArrayOfObjects(input, {});
  outputDOM.innerHTML = result;
}


function callbackGetPerformanceProfile(input, outputComponent) {
  if (typeof outputComponent === "string") {
    outputComponent = document.getElementById(outputComponent);
  }
  //try {
    callbackGetPerformanceProfilePartTwo(input, outputComponent);
  //} catch (e) {
  //  outputComponent.innerHTML = `Failed to process performance profile. ${e}`;
  //}
}

function getPerformanceProfile() {
  var urlForGET = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getPerformanceProfile.rpcCall, {
    net: globals.mainPage().getRPCNetworkOption(),
  });
   submitRequests.submitGET({
    url: urlForGET,
    progress: globals.spanProgress(),
    result : getOutputProfilingStandard(),
    callback: callbackGetPerformanceProfile
  });  
}

function getMemoryPoolArrivalTimes() {
  var urlForGET = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getMemoryPoolArrivalTimes.rpcCall, {
    net: globals.mainPage().getRPCNetworkOption(),
  });
   submitRequests.submitGET({
    url: urlForGET,
    progress: globals.spanProgress(),
    result : getOutputProfilingStandard(),
    callback: callbackMemoryPoolArrivals
  });  
}

function updateProfilingPage() {
  RPCGeneral.updatePageFromRadioButtonsByName(ids.defaults.radioGroups.rpcProfiling);
}

module.exports = {
  updateProfilingPage,
  showStatistics,
  getMemoryInfo,
  getInfo,
  getPerformanceProfile,
  getMemoryPoolArrivalTimes
}