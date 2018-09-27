"use strict";

function revealLongWithParent(container) {
  if (container.nextElementSibling === null) {
    var parent = container.parentNode;
    var newSpan = document.createElement("span");
    newSpan.innerHTML = container.getAttribute("content");
    parent.insertBefore(newSpan, container.nextElementSibling);
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