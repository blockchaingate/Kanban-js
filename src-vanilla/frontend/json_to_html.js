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

function getClickableEntry (input, transformers, ambientLabel, parentLabel, grandParentLabel) {
  if (transformers === undefined || transformers === null) {
    return input;
  } 
  if (!(parentLabel in transformers)) {
    return input;
  }
  //var shouldHighlight = true;
  var hasGrandParent = false;
  var theTransformer = transformers[parentLabel];
  //if (!shouldHighlight) {
  //  return input;
  //}
  totalClickableEntries ++;
  var result = "";
  result += `<button class = "buttonRPCInput"` 
  if (theTransformer.handlerName !== undefined && theTransformer.handlerName !== null) {
    result += `onclick = "${theTransformer.handlerName}(this);"`;
  }
  result += ` content = "${input}"`;
  if (hasGrandParent) {
    result += ` grandParentLabel= "${grandParentLabel}"`;
  }
  result += `>`;
  if (theTransformer.transformer !== undefined && theTransformer.transformer !== null) {
    result += theTransformer.transformer(input);
  } else {
    result += input;
  }
  result += "</button>";
  return result;
}

var totalEntriesToDisplayAtEnds = 4;

function getTableHorizontallyLaidFromJSON(input, transformers, ambientLabel, parentLabel, grandParentLabel) {
  if (
    typeof input === "string" || 
    typeof input === "number" ||
    typeof input === "boolean"
  ) {
    return getClickableEntry(input, transformers, ambientLabel, parentLabel, grandParentLabel);
  }
  if (typeof input === "object") {
    var result = "";
    result += "<table class='tableJSON'>";
    var arrayLength = 0;
    if (Array.isArray(input)) {
      arrayLength = input.length;
    } 
    var numSoFar = 0;
    for (item in input) {
      numSoFar ++;
      if (arrayLength == 0 || numSoFar <= totalEntriesToDisplayAtEnds || numSoFar > arrayLength - totalEntriesToDisplayAtEnds) {
        result += `<tr><td>${item}</td><td>${getTableHorizontallyLaidFromJSON(input[item], transformers, ambientLabel, item, parentLabel)}</td></tr>`; 
      }
      if (arrayLength > 0 && numSoFar === totalEntriesToDisplayAtEnds && totalEntriesToDisplayAtEnds * 2 < arrayLength) {
        result += "<tr><td>...</td></tr>";
      }
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
function getClearParentButton() {
  numberCallsGetHtmlFromArrayOfObjects ++;
  var theId = `clearButton${numberCallsGetHtmlFromArrayOfObjects}`;
  return `<button id = '${theId}' class = "buttonProgress" onclick = "window.kanban.submitRequests.deleteParent(this.id);">clear</button>`;

}

function getHtmlFromArrayOfObjects(input, options) {
  var doIncludeTogglePolling = false; 
  var doShowClearButton = true;
  if (options.flagDontShowClearButton === true) {
    doShowClearButton = false;
  }
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
      return `${getClearParentButton()}<br>${input}<br><b style='color:red; font-size: small'>Could not parse input as JSON.</b>`;
    }
  }
  var rawButton = "";
  var clearButton = "";
  if (doIncludeTogglePolling === true) {
    rawButton = submitRequests.getToggleButtonPausePolling({label: "raw", content: JSON.stringify(input), output: outputPolling});
  } else {
    rawButton = submitRequests.getToggleButton({label: "raw", content: JSON.stringify(input)});
  }
  if (doShowClearButton) {
    clearButton = getClearParentButton();
  }
  var result = "";
  result += rawButton;
  result += clearButton;
  result += "<br>";
  if (typeof inputJSON === "object" && !Array.isArray(inputJSON)) {
    inputJSON = [inputJSON];
  }
  var shouldLayoutAsArrayOfObjects = false; 
  if (Array.isArray(inputJSON)) {
    if (inputJSON.length > 0) {
      if (typeof inputJSON[0] === "object") {
        shouldLayoutAsArrayOfObjects = true; 
      }
    }
  }
  var shouldLayoutAsArrayTable = false;
  if (!shouldLayoutAsArrayOfObjects) {
    if (Array.isArray(inputJSON)) {
      shouldLayoutAsArrayTable = true;
    }
  }
  if (shouldLayoutAsArrayOfObjects) {
    var labelsRows = getLabelsRows(inputJSON);
    result += "<table class='tableJSON'>";
    result += "<tr>";
    for (var counterColumn = 0; counterColumn < labelsRows.labels.length; counterColumn ++) {
      result += `<th>${labelsRows.labels[counterColumn]}</th>`;
    }
    for (var counterRow = 0; counterRow < labelsRows.rows.length; counterRow ++) {
      result += "<tr>";
      for (var counterColumn = 0; counterColumn < labelsRows.labels.length; counterColumn ++) {
        result += `<td>${getTableHorizontallyLaidFromJSON(labelsRows.rows[counterRow][counterColumn], options.transformers, labelsRows.labels[counterColumn], labelsRows.labels[counterColumn])}</td>`;
      }
      result += "</tr>";
    }
    result += "</tr>";
    result += "</table>";
  } else if (shouldLayoutAsArrayTable) {
    result += getTableHorizontallyLaidFromJSON(inputJSON, options.transformers, "", "", "");
  } else {
    result += inputJSON + "<br>";
  }

  return result;
}

module.exports = {
  writeJSONtoDOMComponent,
  getHtmlFromArrayOfObjects,
  getClearParentButton
}