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

function revealLongWithParent(container, content) {
  if (container.nextElementSibling === null) {
    var parent = container.parentNode;
    var newSpan = document.createElement("span");
    numberOfRevealedContents ++;
    var nodeId = `revealedSpan${numberOfRevealedContents}`;
    newSpan.innerHTML = `<br> <span id = "${nodeId}">${content}</span>`;
    parent.insertBefore(newSpan, container.nextElementSibling);
    selectText(nodeId);
  } else  {
    container.nextElementSibling.remove();
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