"use strict";

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
  attachModuleFullNameToHandlerNames
}