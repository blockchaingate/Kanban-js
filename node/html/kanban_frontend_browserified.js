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
window.kanban = {};
window.kanban.getPeerInfo = require('./get_peer_info');
},{"./get_peer_info":3}],3:[function(require,module,exports){
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');

function getPeerInfoTestNet(output, progress){
  if (typeof progress === "undefined"){
    progress = ids.defaults.progressReport
  }

  var theRequest = {};
  theRequest[pathnames.rpc.command] = pathnames.rpc.getPeerInfo;  
  submitRequests.submitGET({
    url: `${pathnames.url.known.rpc}?${pathnames.rpc.command}=${encodeURIComponent(JSON.stringify(theRequest))}`,
    progress: progress,
    result : output 
  });

}

module.exports = {
  getPeerInfoTestNet
}
},{"../pathnames":6,"./ids_dom_elements":4,"./submit_requests":5}],4:[function(require,module,exports){
"use strict";

var defaults = {
  progressReport: "spanProgressReport",

}

module.exports = {
  defaults
}
},{}],5:[function(require,module,exports){
"use srict";
const escapeHtml = require('escape-html');

function recordProgressDone(progress){
  if (progress === null || progress === undefined){
    return;
  }
  if (typeof progress === "string"){
    progress = document.getElementById(progress);
  }
  var theButton = progress.childNodes[0];
  theButton.innerHTML = "<b style='color:green'>Received</b>";
}

function recordProgressStarted(progress, address){
  if (progress === null || progress === undefined){
    return;
  }
  if (typeof progress === "string"){
    progress = document.getElementById(progress);
  }
  progress.innerHTML = "<button class = \"buttonProgress\"" +
  "onclick=\"if (this.nextSibling.nextSibling.style.display === 'none')" +
  "{this.nextSibling.nextSibling.style.display = ''; } else {" +
  "this.nextSibling.nextSibling.style.display = 'none';}\">" +
  "<b style=\"color:orange\">Sent</b></button><br><span style=\"display:none\">" + address + "</span>";
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
    recordResult(xhr.responseText, result);
    if (callback !== undefined && callback !== null){
      callback(xhr.responseText, result);
    }
  };
  xhr.send();
}

module.exports = {
  submitGET
}
},{"escape-html":1}],6:[function(require,module,exports){
(function (__dirname){
"use strict";
var path = {};
path.certificates = __dirname + "/" + "../certificates_secret";
path.HTML = __dirname + "/../html";
var pathname = {
  privateKey: `${path.certificates}/private_key.pem`,
  certificate: `${path.certificates}/certificate.pem`,
  faviconIco: `${path.HTML}/favicon.ico`,
  frontEndBrowserifiedJS: `${path.HTML}/kanban_frontend_browserified.js`,
  frontEndNONBrowserifiedJS: `${__dirname}/frontend/frontend.js`,
  frontEndHTML: `${path.HTML}/kanban_frontend.html`,
  frontEndCSS: `${path.HTML}/kanban_frontend.css`
};

var url = {};
url.known = {
  faviconIco : "/favicon.ico",
  frontEndBrowserifiedJS: "/kanban_frontend_browserified.js",
  frontEndHTML: "/kanban_frontend.html",
  frontEndCSS: "/kanban_frontend.css",
  rpc: "/rpc"
};

url.synonyms = {
  "/" : url.known.frontEndHTML
};

var rpc = {
  command: "command",
  getPeerInfo: "getPeerInfo"
};

url.whiteListed = {};
url.whiteListed[url.known.faviconIco] = pathname.faviconIco;
url.whiteListed[url.known.frontEndBrowserifiedJS] = pathname.frontEndBrowserifiedJS;
url.whiteListed[url.known.frontEndHTML] = pathname.frontEndHTML;
url.whiteListed[url.known.frontEndCSS] = pathname.frontEndCSS;

module.exports = {
  pathname,
  path,
  url,
  rpc
}

}).call(this,"/src")
},{}]},{},[2]);
