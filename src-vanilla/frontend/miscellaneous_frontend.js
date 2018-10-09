"use strict";

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

function getPanelForRevealing(container, content) {
  var parent = container.parentNode;
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
  if (container.nextElementSibling === null) {
    getPanelForRevealing(container, content);
  } else {
    doToggleContent(container, container.nextElementSibling);
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

module.exports = {
  attachModuleFullNameToHandlerNames,
  revealLongWithParent,
  getPanelForRevealing
}