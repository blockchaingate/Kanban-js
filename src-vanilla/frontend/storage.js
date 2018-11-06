"use strict";

const miscellaneousFrontEnd = require('./miscellaneous_frontend');

function Storage() {

  /**@type {Object.<string,{name: string, nameURL: string, nameLocalStorage: string, value: string, changeValueHandler: function}>} 
   * Variables are read off the url and the local storage. 
   * In the future we may store variables in 
   * cookies and indexDB as well.
   * If a variable is specified in more than one of those:
   * url overrides cookies, which override local storage, which overrides the indexDB. 
  */
  this.variables = {
    currentPage: {
      name: "currentPage",
      nameURL: "page",
      nameLocalStorage: "page",
      value: null,
      changeValueHandler: null,
    },
    theme: {
      name: "theme",
      nameLocalStorage: "theme",
      value: null,
      changeValueHandler: null,
    }

  };
  this.oldAnchorString = "";
  /**@type {string} */
  this.currentAnchorString = "";
  this.currentAnchor = {};
  this.computeCurentAnchor();  
}

Storage.prototype.computeCurentAnchor = function () {
  this.currentAnchorString = window.location.hash;
  if (this.currentAnchorString.startsWith('#')) {
    this.currentAnchorString = this.currentAnchorString.slice(1);
  }
  try {
    this.currentAnchor = JSON.parse(decodeURIComponent(this.currentAnchorString));
    if (typeof this.currentAnchor !== "object") {
      this.currentAnchor = {};
    }
  } catch (e) {
  }
}

Storage.prototype.onWindowHashChange = function () {
  this.computeCurentAnchor();
  for (var label in this.currentAnchor) {
    if (!(label in this.variables)) {
      continue;
    }
    var currentVariable = this.variables[label];
    if (currentVariable.value !== this.currentAnchor[label]) {
      this.setVariable(currentVariable, this.currentAnchorString[value], false, false);
    }
  }
}

Storage.prototype.getVariable = function (
  /**@type {string}*/
  incomingLabel
) {
  var label = null;
  if (typeof incomingLabel === "object") {
    label = incomingLabel.name;
  } else {
    label = incomingLabel;
  }
  var currentVariable = this.variables[label];
  return currentVariable.value;
}

Storage.prototype.loadVariable = function (incomingLabel) {
  var label = null;
  if (typeof incomingLabel === "object") {
    label = incomingLabel.name;
  } else {
    label = incomingLabel;
  }
  var currentVariable = this.variables[label];
  if (currentVariable === null || currentVariable === undefined) {
    throw(`Attempt to fetch unknown variable: ${label}`);
  }
  currentVariable.value = null;
  var urlName = currentVariable.nameURL;
  var handler = currentVariable.changeValueHandler;
  if (urlName !== undefined && urlName !== null) {
    var urlValue = this.currentAnchor[urlName];
    if (urlValue !== undefined && urlValue !== null) {
      currentVariable.value = urlValue;
      if (handler !== null && handler !== undefined) {
        handler(currentVariable.value);
      }
      return;
    }
  }
  var localStorageName = currentVariable.nameLocalStorage;
  if (localStorageName !== undefined && localStorageName !== null) {
    var localStorageValue = localStorage.getItem(localStorageName); 
    if (localStorageValue !== undefined && localStorageValue !== null) {
      currentVariable.value = localStorageValue;
      if (handler !== null && handler !== undefined) {
        handler(currentVariable.value);
      }
      return;
    }
  }
}

Storage.prototype.storeInputChange = function (input) {
  var id = null;
  var theInput = null;
  if (typeof input === "string") {
    id = input; 
    theInput =   document.getElementById(id);
  } else {
    theInput = input;
    id = theInput.id;
  }
  this.setVariable(id, theInput.value, true);
}

Storage.prototype.setVariable = function (
  /**@type{string} */
  incomingLabel,
  /**@type{string} */
  value,
  /**@type{boolean} */
  skipCallback,
  /**@type{boolean} */
  updateHash
) {
  var label = incomingLabel;
  if (typeof label === "object") {
    label = label.name;
  }
  if (! (label in this.variables ) ) {
    throw (`Request to update non-registered variable: ${label}.`);
  }
  var currentVariable = this.variables[label]; 
  currentVariable.value = value;
  var localStorageName = currentVariable.nameLocalStorage
  if (localStorageName !== undefined && localStorageName !== null) {
    localStorage.setItem(localStorageName, value);
  } 
  var urlName = currentVariable.nameURL;
  if (urlName !== undefined && urlName !== null) {
    this.currentAnchor[urlName] = value;
    this.currentAnchorString = JSON.stringify(this.currentAnchor);
    if (this.currentAnchorString !== this.oldAnchorString) {
      this.oldAnchorString = this.currentAnchorString;
      if (updateHash !== false) {
        window.location.hash = this.currentAnchorString;
      }
    }
  }
  if (skipCallback === true) {
    return value;
  }
  var handler = currentVariable.changeValueHandler;
  if (handler !== null && handler !== undefined) {
    handler(value);
  }
  return value;
}

Storage.prototype.registerInputBox = function (
  variableName
) {
  if (variableName in this.variables) {
    throw (`Error: variable: ${variableName} already registered.`);
  }
  this.variables[variableName] = {
    name: variableName,
    nameLocalStorage: variableName,
    value: null,
    changeValueHandler: miscellaneousFrontEnd.updateValue.bind(null, variableName)
  }; 
}

Storage.prototype.loadAll = function () {
  for (var label in this.variables) {
    this.loadVariable(label);
  }
}


var storage = new Storage();

module.exports = {
  storage
}