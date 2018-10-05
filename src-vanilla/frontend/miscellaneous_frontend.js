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

function initializePanel(element) {
  element.style.maxHeight = '0px';
  element.style.maxWidth = '0px';
  doToggleContent(element);
}

function doToggleContent(element) { 
  if (element.style.maxHeight === '200px') {
    element.style.opacity = '0';
    element.style.maxHeight = '0';
    element.style.maxWidth = '0';
  } else {
    element.style.opacity = '1';
    element.style.maxHeight = '200px';
    element.style.maxWidth = '1000px';
  }
}

function revealLongWithParent(container, content) {
  if (container.nextElementSibling === null) {
    var parent = container.parentNode;
    var newSpan = document.createElement("span");
    numberOfRevealedContents ++;
    var nodeId = `revealedSpan${numberOfRevealedContents}`;
    newSpan.id = nodeId;
    newSpan.innerHTML = content;
    newSpan.className = "panelRevealedContent";
    parent.insertBefore(newSpan, container.nextElementSibling);
    selectText(nodeId);
    setTimeout(initializePanel.bind(null, newSpan), 0);
  } else {
    doToggleContent(container.nextElementSibling);
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
  revealLongWithParent
}