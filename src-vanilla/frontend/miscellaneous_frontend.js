"use strict";
const ids = require('./ids_dom_elements');
const miscellaneousBackend = require('../miscellaneous');

function selectText(nodeId) {
  var node = document.getElementById(nodeId);
  if (document.body.createTextRange) {
    const range = document.body.createTextRange();
    range.moveToElementText(node);
    range.select();
  } else if (window.getSelection) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    console.warn("Could not select text in node: Unsupported browser.");
  }
}

var numberOfRevealedContents = 0;

function initializePanel(container, element) {
  element.style.maxHeight = '200px';
  element.style.maxWidth = '0px';
  doToggleContent(container, element);
}

function doToggleContent(container, element) { 
  if (element.style.maxHeight === '200px') {
    element.style.opacity = '0';
    element.style.maxHeight = '0';
    element.style.maxWidth = '0';
    container.innerHTML = "&#9668;";
  } else {
    element.style.opacity = '1';
    element.style.maxHeight = '200px';
    element.style.maxWidth = '1500px';
    container.innerHTML = "&#9660;";
    if (element.getElementsByClassName("tableJSON").length === 0) {
      selectText(element.id);
    }
  }
}

function removeUpdateHighlight(id, highlightName) {
  var theElement = null;
  if (typeof id === "string" ) {
    theElement = document.getElementById(id);
  } else {
    theElement = id;
  }
  if (theElement.classList.contains(highlightName)) {
    theElement.classList.remove(highlightName);
  }
}

function highlightError(id) {
  var theElement = document.getElementById(id);
  var highlightName = "inputErrorRecently";
  theElement.classList.add(highlightName);
  setTimeout(removeUpdateHighlight.bind(null, id, highlightName), 1000);
}

function highlightInput(id) {
  var theElement = null;
  if (typeof id === "string") {
    theElement = document.getElementById(id);
  } else {
    theElement = id;
  }
  var highlightName = "inputUsedAsInput";
  theElement.classList.add(highlightName);
  setTimeout(removeUpdateHighlight.bind(null, id, highlightName), 1000);
}

function updateFieldsRecursively(parsedInput, outputs) {
  if (parsedInput === undefined) {
    return;
  }
  if (typeof outputs === "string") {
    var sanitized = miscellaneousBackend.removeQuotes(parsedInput);
    updateValue(outputs, sanitized);
    return;
  }
  for (var label in outputs) {
    if (typeof outputs[label] === "string") {
      var sanitized = miscellaneousBackend.removeQuotes(parsedInput[label]);
      updateValue(outputs[label], sanitized);
    } else if (Array.isArray(outputs[label])){
      var sanitized = miscellaneousBackend.removeQuotes(parsedInput[label]);
      for (var i = 0; i < outputs[label].length; i ++) {
        updateValue(outputs[label][i], sanitized);
      }
    } else {
      updateFieldsRecursively(parsedInput[label], outputs[label]);
    }
  }
}

function highlightOutput(id) {
  var theElement = null;
  if (typeof id === "string") {
    theElement = document.getElementById(id);
  } else {
    theElement = id;
  }
  var highlightName = "updatedRecently";
  theElement.classList.add(highlightName);
  setTimeout(removeUpdateHighlight.bind(null, id, highlightName), 1000);
}

function updateValue(id, content) {
  if (id === ids.defaults.fabcoin.inputBlockInfo.solidityInput) {
    if (typeof content !== "string") {
      return;
    }
    if (window.kanban.ace.editor === null) {
      return;
    }
    window.kanban.ace.editor.setValue(content);
    return;
  }
  var theElement = null;
  if (typeof id === "string") {
    theElement = document.getElementById(id);
  } else {
    theElement = id;
    id = theElement.id;
  }
  if (theElement.value === content) {
    return;
  }
  if (content === undefined || content === null) {
    highlightError(id);
    return;
  }
  var highlightName = "updatedRecently";
  theElement.value = content;
  theElement.classList.add(highlightName);
  setTimeout(removeUpdateHighlight.bind(null, id, highlightName), 1000);
  window.kanban.storageKanban.storeInputChange(id);
}

function updateInnerHtml(id, content) {
  var theElement = document.getElementById(id);
  if (theElement.tagName === "INPUT") {
    theElement.value = content;
  } else {
    theElement.innerHTML = content;
  }
  var highlightName = "updatedRecently";
  theElement.classList.add(highlightName);
  setTimeout(removeUpdateHighlight.bind(null, id, highlightName), 1000);
}

function unHexAndCopy(fromHex, toNonHex) {
  var incoming = fromHex.value;
  if (incoming === undefined || incoming === null) {
    incoming = "";
  }
  var theBuffer = Buffer.from(incoming, "hex");
  var theString = theBuffer.toString('binary');
  updateValue(toNonHex, theString);
}

function transformToHexAndCopy(fromNonHex, toHex) {
  var incoming = fromNonHex.value;
  if (incoming === undefined || incoming === null) {
    incoming = "";
  }
  updateValue(toHex, Buffer.from(incoming).toString('hex'));
}

function hookUpHexWithStringInput(idInputNonHex, idInputHex) {
  var inputNonHex = document.getElementById(idInputNonHex);
  var inputHex = document.getElementById(idInputHex);
  inputNonHex.addEventListener('keydown', transformToHexAndCopy.bind(null, inputNonHex, inputHex));
  inputNonHex.addEventListener('keyup', transformToHexAndCopy.bind(null, inputNonHex, inputHex));
  //inputNonHex.addEventListener('onchange', transformToHexAndCopy.bind(null, inputNonHex, inputHex));
  inputHex.addEventListener('keydown', unHexAndCopy.bind(null, inputHex, inputNonHex));
  inputHex.addEventListener('keyup', unHexAndCopy.bind(null, inputHex, inputNonHex));
  //inputHex.addEventListener('onchange', unHexAndCopy.bind(null, inputHex, inputNonHex));
}

function modifyHeight(panel, newHeight) {
  panel.style.maxHeight = newHeight;
  panel.style.height = newHeight;
}

function standardExpandButtonHandler(containerId) {
  var panel = document.getElementById(containerId)
  var buttonId = panel.getAttribute("buttonExpansion");
  var button = document.getElementById(buttonId);
  var value = window.kanban.storageKanban.getVariable(containerId);
  var desiredHeight = null;
  if (value === "collapsed") {
    desiredHeight = "0px"
    button.innerHTML = "&#9668;";
  } else {
    desiredHeight = panel.getAttribute("originalHeight");
    button.innerHTML = "&#9660;";
  }
  setTimeout(modifyHeight.bind(null, panel, desiredHeight), 0);
}

function toggleStandardPanel(containerId) {
  var currentValue = window.kanban.storageKanban.getVariable(containerId);
  if (currentValue === "expanded") {
    window.kanban.storageKanban.setVariable(containerId, "collapsed");
  } else {
    window.kanban.storageKanban.setVariable(containerId, "expanded");
  }
}

var buttonPanelStandardCount = 0;
function makePanel(container) {
  var expandButtonSpan = document.createElement("span");
  buttonPanelStandardCount ++;
  var buttonId = `buttonPanelStandard${buttonPanelStandardCount}`;
  var originalHeight = window.getComputedStyle(container).height;
  expandButtonSpan.innerHTML = `<button class = "buttonRPCInput" id = "${buttonId}">&#9660;</button>`;
  var previousSibling = container.previousSibling;
  previousSibling.appendChild(expandButtonSpan);
  var theButton = document.getElementById(buttonId);
  container.setAttribute("buttonExpansion", buttonId);
  container.setAttribute("originalHeight", originalHeight);
  theButton.addEventListener('click', toggleStandardPanel.bind(null, container.id));
}

function getPanelForRevealing(container, content) {
  var parent = container.parentNode.parentNode;
  var newSpan = document.createElement("span");
  numberOfRevealedContents ++;
  var nodeId = `revealedSpan${numberOfRevealedContents}`;
  newSpan.id = nodeId;
  newSpan.innerHTML = content;
  newSpan.className = "panelRevealedContent";
  parent.insertBefore(newSpan, container.nextElementSibling);
  setTimeout(initializePanel.bind(null, container, newSpan), 0);
}

function revealLongWithParent(container, content) {
  if (container.parentNode.nextElementSibling === null) {
    getPanelForRevealing(container, content);
  } else {
    doToggleContent(container, container.parentNode.nextElementSibling);
  }
}

function attachModuleFullNameToHandlerNames(transformers, moduleFullName) {
  for (var label in transformers) {
    if ("handlerName" in transformers[label]) {
      transformers[label].handlerName = `${moduleFullName}.${transformers[label].handlerName}`;
    }
    if (transformers[label].parentLabels !== undefined && transformers[label].parentLabels !== null) {
      attachModuleFullNameToHandlerNames(transformers[label].parentLabels);
    }
  }  
}

function setCheckbox(checkboxId, value) {
  var theCheckBox = document.getElementById(checkboxId);
  if (value === true || value === "true") {
    if (theCheckBox.checked !== true) {
      theCheckBox.checked = true;
    }
  } else {
    if (theCheckBox.checked !== false) {
      theCheckBox.checked = false;
    }
  }
}

var errorWordsWithSettings = {
  "error": {color: "red"},
  "Error": {color: "red"},
  "ERROR": {color: "red"},
  "fatal": {color: "red"},
  "Fatal": {color: "red"},
  "FATAL": {color: "red"},
  "panic": {color: "red"},
  "Panic": {color: "red"},
};

function highlightErrorWords(input) {
  if (typeof input !== "string") {
    return input;
  }
  var result = input;
  for (var label in errorWordsWithSettings) {
    result = result.replace(label, `<b style = "color: ${errorWordsWithSettings[label].color}">${label}</b>`);
  } 
  return result;
}

function replaceNewLinesWithBr(input) {
  if (typeof input !== "string") {
    return input;
  }
  return input.replace(/\n/g, "<br>");
}

module.exports = {
  attachModuleFullNameToHandlerNames,
  revealLongWithParent,
  getPanelForRevealing,
  hookUpHexWithStringInput,
  highlightInput,
  highlightOutput,
  highlightError,
  updateInnerHtml,
  updateValue,
  updateFieldsRecursively,
  makePanel,
  standardExpandButtonHandler,
  setCheckbox,
  highlightErrorWords,
  replaceNewLinesWithBr,
};