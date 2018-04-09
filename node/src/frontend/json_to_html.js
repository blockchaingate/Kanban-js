"use srict";
const escapeHtml = require('escape-html');
const submitRequests = require('./submit_requests');

function writeJSONtoDOMComponent(inputJSON, theDomComponent){
  if (typeof theDomComponent === "string"){
    theDomComponent = document.getElementById(theDomComponent);
  }
  theDomComponent.innerHTML = getHtmlFromArrayOfObjects(inputJSON);
}

function getTableHorizontallyLaidFromJSON(input){
  if (typeof input === "string"){
    return input;
  }
  if (typeof input === "number"){
    return input;
  }
  if (typeof input === "boolean"){
    return input;
  }  
  if (typeof input === "object"){
    var result = "";
    result += "<table class='tableJSON'>";
    for (item in input){
      result += `<tr><td>${item}</td><td>${input[item]}</td></tr>`; 
    }
    result += "</table>";
    return result;
  }
  
  return typeof input;
}

function getLabelsRows(input){
  var result = {
    labels: [],
    rows: []
  };
  var labelFinder = {};
  for (var counterRow = 0; counterRow < input.length; counterRow ++){
    for (var label in input[counterRow]){
      labelFinder[label] = true;
    }
  }
  result.labels = Object.keys(labelFinder).sort();
  for (var counterRow = 0; counterRow < input.length; counterRow ++){
    var currentInputItem = input[counterRow];
    result.rows.push([]);
    var currentOutputItem = result.rows[result.rows.length - 1];
    for (var counterLabel = 0; counterLabel < result.labels.length; counterLabel ++){
      var label = result.labels[counterLabel];
      if (label in currentInputItem){
        currentOutputItem.push(currentInputItem[label]);
      } else {
        currentOutputItem.push("");
      }
    }
  }
  return result;
}

function getHtmlFromArrayOfObjects(input){
  var inputJSON = input.replace(/\s/g, ""); 
  if (typeof inputJSON === "string"){
    if (inputJSON[0] !== "{" && inputJSON[0] !== "[" && input[0] !== "\""){
      inputJSON = `"${inputJSON}"`;
    }
    try {
      inputJSON = JSON.parse(inputJSON);
    } catch (e){
      return `<error>Error while parsing ${escape(inputJSON)}: ${e}</error>`;
    }
  }
  if (typeof inputJSON === "string"){
    return inputJSON;
  }
  var labelsRows = getLabelsRows(inputJSON);
  var result = "";
  result += "<table class='tableJSON'>";
  result += "<tr>";
  for (var counterColumn = 0; counterColumn < labelsRows.labels.length; counterColumn ++){
    result += `<th>${labelsRows.labels[counterColumn]}</th>`;
  }
  for (var counterRow = 0; counterRow < labelsRows.rows.length; counterRow ++){
    result += "<tr>";
    for (var counterColumn = 0; counterColumn < labelsRows.labels.length; counterColumn ++){
      result += `<td>${getTableHorizontallyLaidFromJSON(labelsRows.rows[counterRow][counterColumn])}</td>`;
    }
    result += "</tr>";
  }
  result += "</tr>";
  result += "</table>";
  result += submitRequests.getToggleButton({label: "raw JSON", content: input});
  return result;
}

module.exports = {
  writeJSONtoDOMComponent,
  getHtmlFromArrayOfObjects
}