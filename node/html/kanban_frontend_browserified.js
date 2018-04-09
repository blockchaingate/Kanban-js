(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*!
 * escape-html
 * Copyright(c) 2012-2013 TJ Holowaychuk
 * Copyright(c) 2015 Andreas Lubbe
 * Copyright(c) 2015 Tiancheng "Timothy" Gu
 * MIT Licensed
 */

'use strict';

/**
 * Module variables.
 * @private
 */

var matchHtmlRegExp = /["'&<>]/;

/**
 * Module exports.
 * @public
 */

module.exports = escapeHtml;

/**
 * Escape special characters in the given string of html.
 *
 * @param  {string} string The string to escape for inserting into HTML
 * @return {string}
 * @public
 */

function escapeHtml(string) {
  var str = '' + string;
  var match = matchHtmlRegExp.exec(str);

  if (!match) {
    return str;
  }

  var escape;
  var html = '';
  var index = 0;
  var lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34: // "
        escape = '&quot;';
        break;
      case 38: // &
        escape = '&amp;';
        break;
      case 39: // '
        escape = '&#39;';
        break;
      case 60: // <
        escape = '&lt;';
        break;
      case 62: // >
        escape = '&gt;';
        break;
      default:
        continue;
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index
    ? html + str.substring(lastIndex, index)
    : html;
}

},{}],2:[function(require,module,exports){
var getPeerInfoTestNet = require('./get_peer_info').getPeerInfoTestNet;
var getBlock = require('./get_block').getBlock;
var getBestBlockHash = require('./get_best_blockhash').getBestBlockHash;

module.exports = {
  getPeerInfoTestNet, 
  getBestBlockHash,
  getBlock,
}
},{"./get_best_blockhash":4,"./get_block":5,"./get_peer_info":6}],3:[function(require,module,exports){
window.kanban = {};
window.kanban.rpc = require('./fabcoin_rpc');
},{"./fabcoin_rpc":2}],4:[function(require,module,exports){
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');

function getBestBlockHash(output, blockHash,  progress){
  blockHash = document.getElementById(blockHash);
  if (typeof progress === "undefined"){
    progress = ids.defaults.progressReport
  }
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getBestBlockHash.rpcCallLabel),
    progress: progress,
    result : output,
    callback: jsonToHtml.writeJSONtoDOMComponent
  });
}

module.exports = {
  getBestBlockHash
}
},{"../pathnames":10,"./ids_dom_elements":7,"./json_to_html":8,"./submit_requests":9}],5:[function(require,module,exports){
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');

function getBlock(output, blockHash,  progress){
  blockHash = document.getElementById(blockHash);
  if (typeof progress === "undefined"){
    progress = ids.defaults.progressReport
  }
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getBlock.rpcCallLabel, {blockHash: blockHash.value}),
    progress: progress,
    result : output,
    callback: jsonToHtml.writeJSONtoDOMComponent
  });
}

module.exports = {
  getBlock
}
},{"../pathnames":10,"./ids_dom_elements":7,"./json_to_html":8,"./submit_requests":9}],6:[function(require,module,exports){
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');

function getPeerInfoTestNet(output, progress){
  if (typeof progress === "undefined"){
    progress = ids.defaults.progressReport
  }
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getPeerInfo.rpcCallLabel),
    progress: progress,
    result : output,
    callback: jsonToHtml.writeJSONtoDOMComponent
  });

}

module.exports = {
  getPeerInfoTestNet
}
},{"../pathnames":10,"./ids_dom_elements":7,"./json_to_html":8,"./submit_requests":9}],7:[function(require,module,exports){
"use strict";

var defaults = {
  progressReport: "spanProgressReport",

}

module.exports = {
  defaults
}
},{}],8:[function(require,module,exports){
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
},{"./submit_requests":9,"escape-html":1}],9:[function(require,module,exports){
"use srict";
const escapeHtml = require('escape-html');

function getToggleButton(buttonInfo){
  return `<button class = "buttonProgress"
    onclick="if (this.nextSibling.nextSibling.style.display === 'none')
    {this.nextSibling.nextSibling.style.display = ''; this.childNodes[1].innerHTML = '&#9660;';} else {
    this.nextSibling.nextSibling.style.display = 'none'; this.childNodes[1].innerHTML = '&#9668;';}"><span>${buttonInfo.label}</span><b>&#9668;</b></button><br><span class="spanRESTDeveloperInfo" style="display:none">${buttonInfo.content}</span>`;
}

function recordProgressDone(progress){
  if (progress === null || progress === undefined){
    return;
  }
  if (typeof progress === "string"){
    progress = document.getElementById(progress);
  }
  var theButton = progress.childNodes[0].childNodes[0];
  theButton.childNodes[0].innerHTML = "<b style='color:green'>Received</b>";
}

function recordProgressStarted(progress, address){
  if (progress === null || progress === undefined){
    return;
  }
  if (typeof progress === "string"){
    progress = document.getElementById(progress);
  }
  addressHTML = `<a href="${address}" target="_blank">${address}</a>`;
  progress.innerHTML = getToggleButton({content: addressHTML, label: "<b style=\"color:orange\">Sent</b>"});
}

function recordResult(resultText, resultSpan){
  if (resultSpan === null || resultSpan === undefined){
    return;
  }
  if (typeof resultSpan === "string"){
    resultSpan = document.getElementById(resultSpan);
  }
  resultSpan.innerHTML = resultText;
}

/**
 * Fires up a get requests.
 * Expected input: an object with the following fields filled in.
 *
 * inputObject.url: url of the address to get.
 *
 * inputObject.callback: function to callback. The function will be passed on
 *   as arguments the received result.
 *   The result may in addition be displayed in the component inputObject.result, should
 *   this object be provided.
 *   The function will be called only if the get operation was successful.
 *
 * inputObject.progress: id or handle of an object to display the progress of the operation.
 *   Indended for developer use.
 *   Will create a button whose label shows progress of the operation and
 *   clicking which will show/hide the address.
 *   Pass null or undefined if you don't want any progress report.
 *
 * inputObject.result: id or handle of an object to dump the html-escaped
 *   but otherwise non-processed final result.
 *   Pass null or undefined if you don't want to show the result.
 */
function submitGET(inputObject){
  var theAddress = inputObject.url;
  var progress = inputObject.progress;
  var result = inputObject.result;
  var callback = inputObject.callback;
  var xhr = new XMLHttpRequest();
  recordProgressStarted(progress, theAddress);
  xhr.open('GET', theAddress, true);
  xhr.setRequestHeader('Accept', 'text/html');
  xhr.onload = function () {
    recordProgressDone(progress);
    if (callback !== undefined && callback !== null){
      callback(xhr.responseText, result);
    } else { 
      recordResult(xhr.responseText, result);
    }
  };
  xhr.send();
}

module.exports = {
  submitGET,
  getToggleButton
}
},{"escape-html":1}],10:[function(require,module,exports){
(function (__dirname){
"use strict";
var path = {
  certificates: `${__dirname}/../certificates_secret`,
  HTML: `${__dirname}/../html`,
  fabcoin: `${__dirname}/../../../fabcoin-dev`,
  fabcoinSrc: `${__dirname}/../../../fabcoin-dev/src`,
};

var pathname = {
  privateKey: `${path.certificates}/private_key.pem`,
  certificate: `${path.certificates}/certificate.pem`,
  faviconIco: `${path.HTML}/favicon.ico`,
  fabcoinSvg: `${path.HTML}/fabcoin.svg`,
  frontEndBrowserifiedJS: `${path.HTML}/kanban_frontend_browserified.js`,
  frontEndNONBrowserifiedJS: `${__dirname}/frontend/frontend.js`,
  frontEndHTML: `${path.HTML}/kanban_frontend.html`,
  frontEndCSS: `${path.HTML}/kanban_frontend.css`,
  fabcoind: `${path.fabcoinSrc}/fabcoind`,
  fabcoinCli: `${path.fabcoinSrc}/fabcoin-cli`,
};

var url = {};
url.known = {
  faviconIco : "/favicon.ico",
  fabcoinSvg : "/fabcoin.svg",
  frontEndBrowserifiedJS: "/kanban_frontend_browserified.js",
  frontEndHTML: "/kanban_frontend.html",
  frontEndCSS: "/kanban_frontend.css",
  rpc: "/rpc"
};

url.whiteListed = {};
url.whiteListed[url.known.faviconIco] = pathname.faviconIco;
url.whiteListed[url.known.fabcoinSvg] = pathname.fabcoinSvg;
url.whiteListed[url.known.frontEndBrowserifiedJS] = pathname.frontEndBrowserifiedJS;
url.whiteListed[url.known.frontEndHTML] = pathname.frontEndHTML;
url.whiteListed[url.known.frontEndCSS] = pathname.frontEndCSS;


url.synonyms = {
  "/" : url.known.frontEndHTML
};


var rpcCallLabel = "rpcCallLabel";
/**
 * Use null for mandatory variables.
 * Use "" for optional variables.
 * The cli argument gives the order of the commands.
 */
var rpcCalls = {
  getPeerInfo: {
    rpcCallLabel: "getPeerInfo", //must be same as rpc label, used for autocomplete
    command: "getpeerinfo",
    net: "--testnet",
    cli: ["net", "command"]
  },
  getBlock: {
    rpcCallLabel: "getBlock", //must be same as rpc label, used for autocomplete
    command: "getblock",
    blockHash: null, // mandatory input
    net: "--testnet",
    verbosity: null, // mandatory input
    cli: ["net", "command", "blockHash", "verbosity"]
  },
  getBestBlockHash: {
    rpcCallLabel: "getBestBlockHash", //must be same as rpc label, used for autocomplete
    command: "getbestblockhash",
    net: "--testnet",
    cli: ["net", "command"]
  },
}

function getURLfromRPCLabel(theRPClabel, theArguments){
  var theRequest = {};
  theRequest[rpcCallLabel] = theRPClabel;
  var theRPCCall = rpcCalls[theRPClabel];
  for (var label in theRPCCall){
    if (typeof theRPCCall[label] === "string"){
      theRequest[label] = theRPCCall[label]
    } 
  }
  if (theArguments === undefined){
    theArguments = {};
  }
  for (var label in theArguments){
    if (typeof theRPCCall[label] === "string" || theRPCCall[label] === null){
      if (typeof theArguments[label] === "string"){
        theRequest[label] = theRPCCall[label];
      }
    } 
  }
  return `${url.known.rpc}?command=${encodeURIComponent(JSON.stringify(theRequest))}`;
}

function getRPCcallArguments(theRPCLabel, additionalArguments, errors){
  var result = [];
  if (!(theRPCLabel in rpcCalls)){
    errors.push(`Uknown or non-implemented rpc command: ${theRPCLabel}.`);
    return null;
  }
  var theRPCCall = rpcCalls[theRPCLabel];
  for (var counterCommand = 0; counterCommand < theRPCCall.cli.length; counterCommand ++){
    var currentLabel = theRPCCall.cli[counterCommand];
    if (!(currentLabel in additionalArguments)){
      if (!(currentLabel in theRPCCall)){
        console.log(`WARNING: no default given for ${currentLabel} in rpc call labeled ${theRPCLabel}. If this is an optional argument, set the default to an empty string.`.red);
        continue;
      }
      if (typeof theRPCCall[currentLabel] === null){
        errors.push(`Mandatory argument ${currentLabel} missing for rpc command: ${theRPCLabel}`);
        return null;
      }
      if (theRPCCall[currentLabel] === ""){
        continue;
      }
      result.push(theRPCCall[currentLabel]);
    } else {
      if (typeof additionalArguments[currentLabel] === "string"){
        if (additionalArguments[currentLabel] !== ""){
          result.push(additionalArguments[currentLabel]);
          //console.log(`Pusing label ${currentLabel} with value: ${additionalArguments[currentLabel]}.`);
        } 
      }
    }
  }
  return result;
}

module.exports = {
  pathname,
  path,
  url,
  rpcCalls,
  rpcCallLabel,
  getURLfromRPCLabel,
  getRPCcallArguments,
}

}).call(this,"/src")
},{}]},{},[3]);
