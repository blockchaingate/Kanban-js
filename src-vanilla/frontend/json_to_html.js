"use srict";
const submitRequests = require('./submit_requests');
const miscellaneousFrontEnd = require('./miscellaneous_frontend');
const miscellaneousBackEnd = require('../miscellaneous');

function JSONTransformer() {
  /**@type string[] */
  this.bindIdsInOrder = [];
  /**@type {Object.<string,{clickHandler:function, content: any, contentHTML: string, idExpandButton: string, label: string, labelArray:string[], ambientInput: object}>} */
  this.bindings = {};
  this.originalInputs = [];
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

JSONTransformer.prototype.bindButtons = function() {
  // Inside elements are processed first.
  // To traverse the outer elements first then, we need to  
  // enumerate the elements in order opposite to creation order.
  for (var counterLabels = this.bindIdsInOrder.length - 1; counterLabels >= 0; counterLabels --) {
    var idToBindTo = this.bindIdsInOrder[counterLabels];
    if (idToBindTo === "") {
      throw (`Empty bind id. `);
    }
    var currentElement = document.getElementById(idToBindTo);
    var currentLabelData = this.bindings[idToBindTo];
    var currentHandler = currentLabelData.clickHandler;
    if (currentHandler !== undefined && currentHandler !== null && currentElement !== null) {
      var extraData = {
        label: currentLabelData.label,
        labelArray: currentLabelData.labelArray,
        ambientInput: currentLabelData.ambientInput
      };
      currentElement.addEventListener('click', currentHandler.bind(null, currentElement, currentLabelData.content, extraData));
    }
    if (currentLabelData.idExpandButton !== "") {
      var currentExpandButton = document.getElementById(currentLabelData.idExpandButton);
      if (currentExpandButton !== null) {
        var expander = miscellaneousFrontEnd.revealLongWithParent.bind(null, currentExpandButton, currentLabelData.contentHTML);
        currentExpandButton.addEventListener('click', expander);
        miscellaneousFrontEnd.getPanelForRevealing(currentExpandButton, currentLabelData.contentHTML);
      }
    }
  }
}

JSONTransformer.prototype.writeJSONtoDOMComponent =  function(inputJSON, theDomComponent, options) {
  this.bindings = {};
  this.bindIdsInOrder = [];
  this.originalInputs = [];
  if (typeof theDomComponent === "string") {
    theDomComponent = document.getElementById(theDomComponent);
  }
  var outputHTML = this.getHtmlFromArrayOfObjects(inputJSON, options);
  theDomComponent.innerHTML = outputHTML;
  this.bindButtons();
}

var totalClickableEntries = 0;

function getLabelString(input) {
  if (typeof input === "string") {
    if (Number(input).toString() === input) {
      return "${number}";
    }
    return input;
  }
  if (typeof input === "number") {
    return "${number}";
  }
  if (Array.isArray(input)) {
    var result = "";
    for (var i = 0; i < input.length; i ++) {
      result += getLabelString(input[i]);
      if (i !== input.length - 1) {
        result += ".";
      }
    }
    return result;
  }
  return "unknown";
}

function getTransformerForLabel(/** @type {string} */ label, transformers) {
  if (label in transformers) {
    return transformers[label];
  }
  var splitLabel = label.split(".");
  if (splitLabel.length <= 1) {
    return null;
  }
  for (var i = 0; i < splitLabel.length; i ++) {
    var oldValue = splitLabel[i];
    splitLabel[i] = "${any}";
    var newLabel = splitLabel.join(".");
    if (newLabel in transformers) {
      return transformers[newLabel];
    }
    splitLabel[i] = oldValue;
  }
  return null;
}

JSONTransformer.prototype.getClickableEntry = function(input, /**@type {string}*/ inputHTML, transformers, /** @type {string}*/ label, labelArray) {
  if (transformers === undefined || transformers === null) {
    return processInputStringStandard(input);
  }
  var theTransformer = getTransformerForLabel(label, transformers);
  if (theTransformer === null) {
    return processInputStringStandard(input);
  }
  return this.getClickableEntryUsingTransformer(input, inputHTML, theTransformer, label, labelArray)
}

/** @returns {string} */
function processInputStringStandard(input) {
  if (typeof input !== "number") {
    return input;
  }
  return input.toFixed();
}

/** @returns {string} */
JSONTransformer.prototype.getClickableEntryUsingTransformer = function(input, inputHTML, theTransformer, label, labelArray) {
  if (theTransformer === undefined || theTransformer === null) {
    return processInputStringStandard(inputHTML);
  }
  //if (input !== inputHTML) {
  //  console.log(`DEBUG: input and inputHTML: ${JSON.stringify(input)}, ${inputHTML}`);
  //}
  totalClickableEntries ++;
  var currentId = `buttonJSONTransformer${totalClickableEntries}`;
  var idExpandButton = "";
  if (theTransformer.transformer !== undefined && theTransformer.transformer !== null) {
    idExpandButton = `JSONExpandButton${totalClickableEntries}`;
  }
  var transformedContent;
  if (theTransformer.transformer !== undefined && theTransformer.transformer !== null) {
    transformedContent = theTransformer.transformer(inputHTML);
  } else {
    transformedContent = processInputStringStandard(inputHTML);
  }
  if (transformedContent === inputHTML) {
    idExpandButton = "";
  }
  if (currentId === "" || typeof currentId !== "string" ) {
    throw(`Invalid currentId: ${currentId}`);
  }
  this.bindIdsInOrder.push(currentId);
  this.bindings[currentId] = {
    content: input,
    contentHTML: inputHTML,
    clickHandler: theTransformer.clickHandler,
    idExpandButton: idExpandButton,
    label: label,
    labelArray: labelArray.slice(),
    ambientInput: this.originalInputs[this.originalInputs.length - 1]
  };

  var result = "";
  if (idExpandButton !== "") {
    result += `<span class = "panelRPCWithExpansion">`;
  }
  if (theTransformer.clickHandler !== null && theTransformer.clickHandler !== undefined) {
    var tooltipClass = "";
    if (theTransformer.tooltip !== undefined && theTransformer.tooltip !== null) {
      tooltipClass = " tooltip";
    }
    result += `<button class = "buttonRPCInput${tooltipClass}" id = "${currentId}">`; 
  }
  result += transformedContent;
  if (theTransformer.clickHandler !== null && theTransformer.clickHandler !== undefined) {
    if (theTransformer.tooltip !== undefined && theTransformer.tooltip !== null) {
      result += `<span class = "tooltiptext">${theTransformer.tooltip}</span>`;
    }
    result += `</button>`;
  }
  if (idExpandButton !== "") {
    result += `<button id = "${idExpandButton}" class = "buttonJSONExpand">&#9668;</button>`;
    result += `</span>`;
  }
  return result;
}

var totalEntriesToDisplayAtEnds = 4;

JSONTransformer.prototype.getTableHorizontallyLaidFromJSON = function(input, options, labelString, labelArray) {
  if (
    typeof input === "string" || 
    typeof input === "number" ||
    typeof input === "boolean"
  ) {
    return this.getClickableEntry(input, input, options.transformers, labelString, labelArray);
  }
  if (typeof input !== "object") {
    return typeof input;
  }
  var newLabel = "";
  var arrayLength = 0;
  if (Array.isArray(input)) {
    arrayLength = input.length;
  } 
  var numSoFar = 0;
  var transformerAll = null;
  if (labelString !== null && labelString !== undefined) {
    transformerAll = getTransformerForLabel(labelString, options.transformers);
  }
  var labelOfLabel;
  if (labelString !== null && labelString !== undefined) {
    labelOfLabel = labelString + ".${label}";
  } else {
    labelOfLabel = "${label}"; 
  }
  var labelTransformer = getTransformerForLabel(labelOfLabel, options.transformers);
  var labelToDisplay = "";
  var resultContent = "";
  if (labelArray === undefined) {
    labelArray = [];
  }
  resultContent += "<table class='tableJSON'>";
  var entriesAtEachEnd = totalEntriesToDisplayAtEnds;
  if (options.totalEntriesToDisplayAtEnds !== undefined && options.totalEntriesToDisplayAtEnds !== null) {
    entriesAtEachEnd = options.totalEntriesToDisplayAtEnds;
  }
  for (item in input) {
    numSoFar ++;
    var newLabelArray; 
    if (labelString !== "" && typeof labelString === "string") {
      newLabel = getLabelString([labelString, item]);
      newLabelArray = labelArray.slice();
      newLabelArray.push(item); 
    } else {
      newLabel = getLabelString(item);
      newLabelArray = [item];
    }
    if (labelTransformer === null) {
      labelToDisplay = abbreviateLabel(item);
    } else {
      labelToDisplay = this.getClickableEntryUsingTransformer(item, item, labelTransformer, item, labelArray);
    }
    if (arrayLength == 0 || numSoFar <= entriesAtEachEnd || numSoFar > arrayLength - entriesAtEachEnd) {
      resultContent += `<tr><td>${labelToDisplay}</td><td>${this.getTableHorizontallyLaidFromJSON(input[item], options, newLabel, newLabelArray)}</td></tr>`; 
    }
    if (arrayLength > 0 && numSoFar === entriesAtEachEnd && entriesAtEachEnd * 2 < arrayLength) {
      resultContent += "<tr><td>...</td></tr>";
    }
  }
  resultContent += "</table>";
  var result = this.getClickableEntryUsingTransformer(input, resultContent, transformerAll, labelString, labelArray);
  return result;  
}

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

/** @returns {{labels: String[], rows: Object[]}} */
function getLabelsRowsFromArrayOfObjects(input) {
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

/** @returns {{labels: String[], rows: Object[]}} */
JSONTransformer.prototype.transformObjectToRows = function(input) {
  var result = [];
  for (var labelRow in input) {
    var currentInputItem = input[labelRow];
    currentInputItem["_rowLabel"] = labelRow;
    result.push(currentInputItem);
  }
  return result;
}


var numberCallsGetHtmlFromArrayOfObjects = 0;
function getClearParentButton() {
  numberCallsGetHtmlFromArrayOfObjects ++;
  var theId = `clearButton${numberCallsGetHtmlFromArrayOfObjects}`;
  return `<button id = '${theId}' class = "buttonProgress" onclick = "window.kanban.submitRequests.deleteParent(this.id);">clear</button>`;
}

var labelAbbreviations = {
  "difficulty" : "diff.",
  "gasUsed": "g.used",
  "hashNoSignature": "hash no sig",
  "logsBloom": "l-bloom",
  "receiptsRoot": "rec.rt.",
  "totalDifficulty": "ttl diff.",
  "transactions": "txs",
  "transactionsRoot": "txRoot",
  "aggregateSignatureStatus": "agg. status",
  "signerIndex": "signInd.",
  "timerExpiresIn": "timer.exp",
  "proposerAddress": "prop.addr.",
  "proposerIndex": "prop.#",
  "address": "addr.",
  "strippedsize": "strip",
  "bip125-replaceable": "b125-r.",
  "confirmations": "conf.",
  "walletconflicts": "w.confl.",
  "blockindex": "bl.ind.",
  "generated": "gen.",
  "ethereumAddressHex": "ethAddrHex",
  "fabAddressMainnetBase58Check": "fabAddrMain58Ch",
  "fabAddressMainnetHexNocheck": "fabAddrMHex",
  "fabAddressTestnetBase58Check": "fabAddrTHexCh",
  "fabAddressTestnetHexNocheck": "fabAddrTHex",
  "inputPrivateKeyBase58CheckRecoded": "inPriv58ChRe",
  "inputPrivateKeyBase58": "inPriv58",
  "inputPrivateKeyBase58Recoded": "inPriv58Re",
  "inputPrivateKeyHex": "inPrivHex",
  "publicKeyHex": "pubHex",
  "publicKeyHexInternal": "pubHexInt",
  "stateMutability": "st.mut.",
  "privateKeyBase58Check": "priv58Ch",
  "privateKeyBase58WithoutCheck": "priv58NoCh",
  "privateKeyHex": "privHex", 
  "publicKeyHexCompressed": "pubHexCompressed",
  "aggregateCommitmentFromSignature": "aggCommFrSig.",
  "committedSignersBitmap": "commSign.",
  "aggregateCommitment": "aggComm.",
  "commitmentHexCompressed": "commHex.",
  "lockingCoefficients": "lckCf.",
  "myLockingCoefficient": "myLckCf.",
  "aggregatePublicKey": "aggPubKey",
  "signatureNoBitmap": "sigNoBmp.",
  "aggregateSolution": "aggSoln.",
  "knownPublicKeys": "pubKeys",
  "concatenatedPublicKeys": "concatPubK",
  "messageDigest": "msgDgst.",
  "totalProcessedIncomingVoteMessages": "totalIn",
  "totalProcessedOutgoingVoteMessages": "totalOut",
  "totalMessagesNotSentAsTheyAreAlreadyKnown": "totalOptimizedOut",
}

function abbreviateLabel(/** @type {string}*/ header) {
  if (!(header in labelAbbreviations)) {
    return header
  }
  return labelAbbreviations[header];
}

/**@returns {{inputJSON: Object, htmlSoFar: string}} */
JSONTransformer.prototype.getHtmlPreamble = function(input, /**@type {OptionsJSON} */ options) {
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
  this.originalInputs.push(miscellaneousBackEnd.deepCopy(inputJSON, 0));
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
  return {inputJSON: inputJSON, htmlSoFar: result};
}

/**@typedef {{clickHandler: Function, transformer: Function, tooltip: string}} Transformer */
/**@typedef {Object.<string,Transformer>} TransformerCollection */
/**@typedef {{transformers: TransformerCollection, layoutObjectAsArray: Boolean} } OptionsJSON */

JSONTransformer.prototype.getHtmlFromArrayOfObjects = function(input, /**@type {OptionsJSON} */ options) {
  var preamble = this.getHtmlPreamble(input, options);
  var result = "";
  result += preamble.htmlSoFar;
  var inputJSON = preamble.inputJSON;
  if (options.layoutObjectAsArray && typeof inputJSON === "object") {
    inputJSON = this.transformObjectToRows(inputJSON);
  }
  if (typeof inputJSON === "object" && !Array.isArray(inputJSON)) {
    inputJSON = [inputJSON];
  }
  var shouldLayoutAsArrayTable = false;
  var shouldLayoutAsArrayOfObjects = false; 
  if (Array.isArray(inputJSON)) {
    if (inputJSON.length > 0) {
      if (typeof inputJSON[0] === "object") {
        shouldLayoutAsArrayOfObjects = true; 
      }
    }
  }
  if (!shouldLayoutAsArrayOfObjects) {
    if (Array.isArray(inputJSON)) {
      shouldLayoutAsArrayTable = true;
    }
  }
  if (options.transformers === undefined || options.transformers === null) {
    options.transformers = {};
  }
  if (shouldLayoutAsArrayOfObjects) {
    var labelsRows = getLabelsRowsFromArrayOfObjects(inputJSON);
    result += "<table class='tableJSON'>";
    result += "<tr>";
    for (var counterColumn = 0; counterColumn < labelsRows.labels.length; counterColumn ++) {
      var header = this.getClickableEntryUsingTransformer(
        labelsRows.labels[counterColumn], 
        labelsRows.labels[counterColumn], 
        options.transformers["${label}"], 
        "${label}",
        []
      );
      if (options.transformers["${label}"] === undefined) {
        header = `<small>${abbreviateLabel(header)}</small>`;
      }
      result += `<th>${header}</th>`;
    }
    for (var counterRow = 0; counterRow < labelsRows.rows.length; counterRow ++) {
      result += "<tr>";
      for (var counterColumn = 0; counterColumn < labelsRows.labels.length; counterColumn ++) {
        var currentEntry = this.getTableHorizontallyLaidFromJSON(
          labelsRows.rows[counterRow][counterColumn], 
          options, 
          labelsRows.labels[counterColumn],
          [labelsRows.labels[counterColumn]]
        );
        result += `<td>${currentEntry}</td>`;
      }
      result += "</tr>";
    }
    result += "</tr>";
    result += "</table>";
  } else if (shouldLayoutAsArrayTable) {
    result += this.getTableHorizontallyLaidFromJSON(inputJSON, options, null, []);
  } else {
    result += `${this.getClickableEntryUsingTransformer(inputJSON, inputJSON, options.transformers.singleEntry, "singleEntry", [])}`; 
  }
  return result;
}

module.exports = {
  JSONTransformer,
  getClearParentButton
}