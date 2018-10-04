"use strict";
const submitRequests = require('./../submit_requests');
const pathnames = require('../../pathnames');
const ids = require('./../ids_dom_elements');
const jsonToHtml = require('./../json_to_html');
const globals = require('./../globals');
const RPCGeneral = require('./fabcoin_rpc_general');
const escapeHTML = require('escape-html');
const chartJS = require('chart.js');
const miscellaneous = require('../../miscellaneous');
const jsZip = require("jszip");

function callbackMemoryPoolArrivals(input, outputComponent) {
  try {
    window.kanban.profiling.memoryPoolArrivalTimes = JSON.parse(input);
  } catch (e) {
    console.log(`Error while parsing memory pool arrivals. ${e}`);
  }
  var transformer = new jsonToHtml.JSONTransformer();
  transformer.writeJSONtoDOMComponent(input, outputComponent, {});
}

function callbackProfilingStandard(input, outputComponent) {
  var transformer = new jsonToHtml.JSONTransformer();
  transformer.writeJSONtoDOMComponent(input, outputComponent, {});
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
  if (window.kanban.profiling.chart !== undefined) {
    window.kanban.profiling.chart.destroy();
  }
  var theChartCanvas = document.getElementById("chartProfiling");
  var drawingContext = theChartCanvas.getContext('2d'); 
  window.kanban.profiling.chart = createChart(inputLabel, drawingContext);
  var downloadHtml = "";
  downloadHtml += `<a href = "#download${inputLabel}" download="chartPerformance${inputLabel}.png" `; 
  downloadHtml += ` onclick = "window.kanban.rpc.profiling.downloadChartDefaultSetHref(this);" >download</a>`;
  var downloadSpan = document.getElementById("spanDownloadChart");
  downloadSpan.innerHTML = downloadHtml;
}

function createChart(inputLabel, drawingContext) {
  var stats = window.kanban.profiling.statistics[inputLabel];
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
  var inputLabelDecoded = miscellaneous.shortenString(decodeURIComponent(inputLabel), 50, false);
  return new Chart(drawingContext, {
    type: 'bar',
    data: {
        labels: finalLabels,
        datasets: [{
            label: `${inputLabelDecoded} performance`,
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
          },
          scaleLabel: {
            display: true,
            labelString: '# calls'
          }
      }],
      xAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'run time \u03BCs'
        }
      }]
    }
  }});
}

function downloadChartAsPngSetHref(theLink, theChart) {
  var theDataURL = theChart.toBase64Image('image/png');
  theLink.setAttribute("href", theDataURL);
}

function downloadChartDefaultSetHref(theLink) {
  return downloadChartAsPng(theLink, window.kanban.profiling.chart);
}

function downloadChartFromCanvasAsPng(theLink, canvas) {
  if (typeof canvas === "string") {
    canvas = document.getElementById(canvas);
  }
  var theDataURL = canvas.toDataURL('image/png');
  theLink.setAttribute("href", theDataURL);
}

function prepareDownloadAllCharts() {
  var zipper = new jsZip();
  var theChartCanvas = document.getElementById("chartProfiling");
  var drawingContext = theChartCanvas.getContext('2d'); 
  var currentChart = null;
  var stats = window.kanban.profiling.statistics;
  var statDetails = window.kanban.profiling.statDetails;
  var theLatexFile = "";
  theLatexFile += "\\documentclass{article}\n\\usepackage{graphicx}\n";
  theLatexFile += "\\usepackage{array}\n\\newcolumntype{P}[1]{>{\\hspace{0pt}}p{#1}}\n";
  theLatexFile += "\\begin{document}\n\n";
  theLatexFile += `${statDetails.totalFabcoinRunTimeString}\n\n`;
  theLatexFile += "\\begin{tabular}{P{5cm}|r|r|r}\nFunction&\\# calls& Avg.run time $\\mu$s& Run time excl. subord. \\\\\\hline\n";

  var theChartLatex = "";
  for (var label in stats) {
    if (currentChart !== null) {
      currentChart.destroy();
      currentChart = null;
    }
    var currentStats = stats[label];
    var labelDecoded = decodeURIComponent(label);
    labelDecoded = labelDecoded.split("::").join(" :: "); //<- just like replace but works with all occurrences
    labelDecoded = labelDecoded.split("->").join(" $\\to$ "); //<- just like replace but works with all occurrences
    theLatexFile += `${labelDecoded}& ${currentStats.runTime.numberOfSamples}& ${currentStats.averageRunTime}&`;
    if (currentStats.runTimeSubordinates !== null && currentStats.runTimeSubordinates !== undefined) {
      theLatexFile += currentStats.averageRunTimeExcludingSubordinates;
    }
    theLatexFile += "\\\\\\hline\n";
    if (currentStats.runTime.histogram === undefined || currentStats.runTime.histogram === null) {
      continue;
    }
    currentChart = createChart(label, drawingContext);
    currentChart.render({duration: 0, lazy: false});
    var theDataURL = currentChart.toBase64Image('image/png');
    var dataBase64 = theDataURL.slice(22);
    var imageFileName = `images/chart${label}.png`;
    imageFileName = imageFileName.split("%").join("_"); //<- latex doesn't like % so we replace them by underscores.
    theChartLatex += `\n\\includegraphics[width=5cm]{${imageFileName}}`;
    zipper.file(imageFileName, dataBase64, {base64: true});
  }
  theLatexFile += "\\end{tabular}\n"
  theLatexFile += theChartLatex;

  theLatexFile += "\n\\end{document}"
  zipper.file("texoutput.tex",theLatexFile);

  zipper.generateAsync({type: "base64"}).then(function(theData) {
    console.log("DEBUG: zipped data: " + theData);
    var zippedDataURL = `data:application/zip;base64,${theData}`;
    var theLink = document.getElementById("linkDownloadAll");
    theLink.style.visibility = "";
    theLink.href = zippedDataURL;  
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
    currentStats.averageRunTime = currentStats.runTime.totalRunTime;
    currentStats.averageRunTime /= numberOfSamples;
    currentStats.averageRunTime = currentStats.averageRunTime.toFixed(0);
    result += `<td>${currentStats.averageRunTime} &#956;s</td>`;
    if (currentStats.runTimeSubordinates != undefined && currentStats.runTimeSubordinates !== null) {
      currentStats.averageRunTimeExcludingSubordinates = currentStats.runTimeExcludingSubordinatesInMicroseconds;
      currentStats.averageRunTimeExcludingSubordinates /= numberOfSamples;
      currentStats.averageRunTimeExcludingSubordinates = currentStats.averageRunTimeExcludingSubordinates.toFixed(0);
      result += `<td>${currentStats.averageRunTimeExcludingSubordinates} &#956;s</td>`;
    }
    result += "</tr>";
  }
  result += "</table>";
  var downloadHtml = "";   
  downloadHtml += "<button onclick = 'window.kanban.rpc.profiling.prepareDownloadAllCharts()'>Prepare download</button>";
  downloadHtml += `<br><a href = "#downloadAllCharts" download="chartPerformance.zip" id = "linkDownloadAll" style='visibility:hidden'>download all</a>`;
  result += downloadHtml;
  return result;
}

function callbackGetPerformanceProfilePartTwo(input, outputDOM) {
  var inputParsed = JSON.parse(input);
  var result = "";
  result += submitRequests.getToggleButtonPausePolling({label: "raw", content: JSON.stringify(input)});
  result += jsonToHtml.getClearParentButton();

  var statDetails = window.kanban.profiling.statDetails;
  
  statDetails.totalFabcoinRunTime = 0; 
  var timeStarts = inputParsed.timePastStarts;
  var timeSamplings = inputParsed.timePastSamplings;
  for (var counterStarts = 0; counterStarts < timeStarts.length; counterStarts ++ ) {
    statDetails.totalFabcoinRunTime += timeSamplings[counterStarts] - timeStarts[counterStarts];
  }
  statDetails.totalFabcoinRunTimeString = `Profiling recorded over ${miscellaneous.getDurationReadableFromMilliseconds(statDetails.totalFabcoinRunTime)} with ${timeStarts.length - 1} system restarts. Stats persist across restarts.`;
  result += `<br>${statDetails.totalFabcoinRunTimeString}`;
  result += "<table><tr><td>";
  result += getGraphsTable(inputParsed);
  result += "</td><td>";
  result += "<span style= 'display:inline-block; max-height:400px; max-width:400px;'><canvas id = 'chartProfiling' style='height:400px; width:400px;'></canvas></span><br><span id='spanDownloadChart'></span>";
  result += "</td></tr></table>";
  result += getThreadTable(inputParsed);
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
  downloadChartDefaultSetHref,
  downloadChartAsPngSetHref,
  downloadChartFromCanvasAsPng,
  prepareDownloadAllCharts,
  showStatistics,
  getMemoryInfo,
  getInfo,
  getPerformanceProfile,
  getMemoryPoolArrivalTimes
}