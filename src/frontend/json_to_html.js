"use srict";
const escapeHtml = require('escape-html');
const submitRequests = require('./submit_requests');

function writeJSONtoDOMComponent(inputJSON, theDomComponent, options) {
  if (typeof theDomComponent === "string") {
    theDomComponent = document.getElementById(theDomComponent);
  }
  var outputHTML = getHtmlFromArrayOfObjects(inputJSON, options);
  theDomComponent.innerHTML = outputHTML;
}

var totalClickableEntries = 0;

function getClickableEntry (input, transformers, ambientLabel) {
  if (transformers === undefined || transformers === null) {
    return input;
  } 
  if (!(ambientLabel in transformers)) {
    return input;
  }
  totalClickableEntries ++;
  var result = "";
  var theFunction = transformers[ambientLabel];
  result += `<button class = "buttonRPCInput" onclick = "${theFunction.name}('${input}')">`;
  if (theFunction.transformer !== undefined && theFunction.transformer !== null) {
    result += theFunction.transformer(input);
  } else {
    result += input;
  }
  result += "</button>";
  return result;
}

function getTableHorizontallyLaidFromJSON(input, transformers, ambientLabel) {
  if (
    typeof input === "string" || 
    typeof input === "number" ||
    typeof input === "boolean"
  ) {
    return getClickableEntry(input, transformers, ambientLabel);
  }
  if (typeof input === "object") {
    var result = "";
    result += "<table class='tableJSON'>";
    for (item in input){
      result += `<tr><td>${item}</td><td>${getTableHorizontallyLaidFromJSON(input[item], transformers, ambientLabel)}</td></tr>`; 
    }
    result += "</table>";
    return result;
  }
  
  return typeof input;
}

var keyWeights = {
  height: 1000,
  hash: 100,
  tx: 50,
  blockhash: 40,
  previousblockhash: 30,
  previousBlock: 30,
  nextblockhash: 29,
  confirmations: 10
};

function getLabelWeight(label) {
  if (label in keyWeights) {
    return keyWeights[label];
  }
  return - 1;
}

function labelComparisonOperator(left, right) {
  if (getLabelWeight(left) > getLabelWeight(right)) {
    return - 1;
  }
  if (getLabelWeight(left) < getLabelWeight(right)) {
    return 1;
  }
  if (left < right) {
    return - 1;
  }  
  if (left > right) {
    return 1;
  }
  return 0;
}

function getLabelsRows(input) {
  var result = {
    labels: [],
    rows: []
  };
  var labelFinder = {};
  for (var counterRow = 0; counterRow < input.length; counterRow ++) {
    for (var label in input[counterRow]) {
      labelFinder[label] = true;
    }
  }
  result.labels = Object.keys(labelFinder).sort(labelComparisonOperator);
  for (var counterRow = 0; counterRow < input.length; counterRow ++) {
    var currentInputItem = input[counterRow];
    result.rows.push([]);
    var currentOutputItem = result.rows[result.rows.length - 1];
    for (var counterLabel = 0; counterLabel < result.labels.length; counterLabel ++) {
      var label = result.labels[counterLabel];
      if (label in currentInputItem) {
        currentOutputItem.push(currentInputItem[label]);
      } else {
        currentOutputItem.push("");
      }
    }
  }
  return result;
}

var numberCallsGetHtmlFromArrayOfObjects = 0;
function getHtmlFromArrayOfObjects(input, options) {
  var doIncludeTogglePolling = false; 
  var outputPolling = null; 
  if (options.polling !== undefined && options.polling !== null) {
    doIncludeTogglePolling = options.polling.doPoll;
    outputPolling = options.polling.output;
  }
  var inputJSON = input;
  if (typeof inputJSON === "string") {
    inputJSON = input.replace(/[\r\n]/g, " "); 
    if (inputJSON[0] !== "{" && inputJSON[0] !== "[" && input[0] !== "\"") {
      inputJSON = `"${inputJSON}"`;
    }
    try {
      inputJSON = JSON.parse(inputJSON);
    } catch (e) {
      return `<error>Error while parsing ${inputJSON}: ${e}</error>`;
    }
  }
  var rawButton = "";
  if (doIncludeTogglePolling === true) {
    rawButton = submitRequests.getToggleButtonPausePolling({label: "raw", content: JSON.stringify(input), output: outputPolling});
  } else {
    rawButton = submitRequests.getToggleButton({label: "raw", content: JSON.stringify(input)});
  }
  numberCallsGetHtmlFromArrayOfObjects ++;
  var theId = `clearButton${numberCallsGetHtmlFromArrayOfObjects}`;
  var clearButton = `<button id = '${theId}' class = "buttonProgress" onclick = "window.kanban.submitRequests.deleteParent(this.id);">clear</button>`;
  var result = "";
  if (typeof inputJSON === "object" && !Array.isArray(inputJSON)) {
    inputJSON = [inputJSON];
  }
  if (Array.isArray(inputJSON)) {
    var labelsRows = getLabelsRows(inputJSON);
    result += "<table class='tableJSON'>";
    result += "<tr>";
    for (var counterColumn = 0; counterColumn < labelsRows.labels.length; counterColumn ++) {
      result += `<th>${labelsRows.labels[counterColumn]}</th>`;
    }
    for (var counterRow = 0; counterRow < labelsRows.rows.length; counterRow ++) {
      result += "<tr>";
      for (var counterColumn = 0; counterColumn < labelsRows.labels.length; counterColumn ++) {
        result += `<td>${getTableHorizontallyLaidFromJSON(labelsRows.rows[counterRow][counterColumn], options.transformers, labelsRows.labels[counterColumn])}</td>`;
      }
      result += "</tr>";
    }
    result += "</tr>";
    result += "</table>";
  } else {
    result += inputJSON + "<br>";
  }
  result += rawButton;
  result += clearButton;

  return result;
}

module.exports = {
  writeJSONtoDOMComponent,
  getHtmlFromArrayOfObjects
}