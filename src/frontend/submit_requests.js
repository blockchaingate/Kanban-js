"use srict";
const escapeHtml = require('escape-html');

function buttonProgressClick(buttonElement) {
  //console.log(buttonElement);
  if (buttonElement.nextSibling.nextSibling.nextSibling.style.display === 'none') {
    buttonElement.nextSibling.nextSibling.nextSibling.style.display = ''
    buttonElement.childNodes[1].innerHTML = '&#9660;'; 
    buttonElement.parentElement.setAttribute('addressDisplayStyle', "shown");
  } else {
    buttonElement.nextSibling.nextSibling.nextSibling.style.display = 'none';
    buttonElement.childNodes[1].innerHTML = '&#9668;';
    buttonElement.parentElement.setAttribute('addressDisplayStyle', "hidden");
  }
}

function getToggleButton(buttonInfo) {
  var result = "";
  var addressDisplayStyle = "hidden";
  if (buttonInfo.parent !== undefined) {
    addressDisplayStyle = buttonInfo.parent.getAttribute("addressDisplayStyle");
  }
  if (addressDisplayStyle === undefined || addressDisplayStyle === "" || addressDisplayStyle === null) {
    addressDisplayStyle = "hidden";
  }
  var addressDisplayStyleString = "";
  var buttonArrow = "&#9660;";
  if (addressDisplayStyle === "hidden") { 
    addressDisplayStyleString = "none";
    buttonArrow = "&#9668;";
  }
  result += `<button class = "buttonProgress" `;
  result += `onclick = "window.kanban.submitRequests.buttonProgressClick(this);">`;
  result += `<span>${buttonInfo.label}</span><b>${buttonArrow}</b></button><span class = "timerSpan"></span>`;
  result += `&nbsp;&nbsp;&nbsp;&nbsp;<span class="spanRESTDeveloperInfo" style = "display:${addressDisplayStyleString}">${buttonInfo.content}</span>`;
  return result;
}

function getToggleButtonPausePolling(buttonInfo) {
  return `<button class = "buttonProgress"
    onclick="if (this.nextSibling.nextSibling.style.display === 'none')
    {this.nextSibling.nextSibling.style.display = ''; this.childNodes[1].innerHTML = '&#9660;'; window.kanban.computationalEngineCalls.clearPollId();} else {
    this.nextSibling.nextSibling.style.display = 'none'; this.childNodes[1].innerHTML = '&#9668;';window.kanban.computationalEngineCalls.pollServerDoStart(${buttonInfo.output});}"><span>${buttonInfo.label}</span><b>&#9668;</b></button><br><span class="spanRESTDeveloperInfo" style="display:none">${buttonInfo.content}</span>`;
}

function deleteParent(id) {
  document.getElementById(id).parentElement.innerHTML = "";
}

function removeUpdateHighlight(id, highlightName) {
  var theElement = document.getElementById(id);
  theElement.classList.remove(highlightName);
}

function highlightError(id) {
  var theElement = document.getElementById(id);
  var highlightName = "inputErrorRecently";
  theElement.classList.add(highlightName);
  setTimeout(removeUpdateHighlight.bind(null, id, highlightName), 1000);
}

function highlightInput(id) {
  var theElement = document.getElementById(id);
  var highlightName = "inputUsedAsInput";
  theElement.classList.add(highlightName);
  setTimeout(removeUpdateHighlight.bind(null, id, highlightName), 1000);
}

function updateValue(id, content) {
  var theElement = document.getElementById(id);
  if (theElement.value === content) {
    return;
  }
  var highlightName = "updatedRecently";
  theElement.value = content;
  theElement.classList.add(highlightName);
  setTimeout(removeUpdateHighlight.bind(null, id, highlightName), 1000);
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

function recordProgressDone(progress) {
  if (progress === null || progress === undefined) {
    return;
  }
  if (typeof progress === "string") {
    progress = document.getElementById(progress);
  }
  var theButton = progress.childNodes[0].childNodes[0];
  var startTime = parseInt(progress.getAttribute("startTime"));
  var elapsedTime = (new Date()).getTime();
  var timeMs = elapsedTime - startTime;
  progress.getElementsByClassName("timerSpan")[0].innerHTML = `${timeMs} ms`;
  theButton.childNodes[0].innerHTML = `<b style='color:green'>Received</b>`;
}

function recordProgressStarted(progress, address, startTime, isPOST) {
  if (progress === null || progress === undefined) {
    return;
  }
  if (typeof progress === "string") {
    progress = document.getElementById(progress);
  }
  if (isPOST === undefined || isPOST === null) {
    isPOST = false;
  }
  var addressHTML;
  if (!isPOST){
    addressHTML = `<a href="${address}" target = "_blank">${unescape(address)}</a>`;
  } else {
    addressHTML = address;
  }
  progress.setAttribute("startTime", startTime.toFixed());
  progress.innerHTML = getToggleButton({
    content: addressHTML, 
    label: "<b style=\"color:orange\">Sent</b>",
    parent: progress
  });
}

function recordResult(resultText, resultSpan) {
  if (resultSpan === null || resultSpan === undefined) {
    return;
  }
  if (typeof resultSpan === "string") {
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
function submitGET(inputObject) {
  var theAddress = inputObject.url;
  var progress = inputObject.progress;
  var result = inputObject.result;
  var callback = inputObject.callback;
  var xhr = new XMLHttpRequest();
  recordProgressStarted(progress, theAddress, (new Date()).getTime(), false);
  xhr.open('GET', theAddress, true);
  xhr.setRequestHeader('Accept', 'text/html');
  xhr.onload = function () {
    recordProgressDone(progress);
    if (callback !== undefined && callback !== null) {
      callback(xhr.responseText, result);
    } else { 
      recordResult(xhr.responseText, result);
    }
  };
  xhr.send();
}

/**
 * Same as submitGET but uses POST instead.
 * In addition to the inputs of submitGET, this call all expects:
 *
 * inputObject.messageBody: content of the message to send.
 */
function submitPOST(inputObject) {
  var theAddress = inputObject.url;
  var progress = inputObject.progress;
  var result = inputObject.result;
  var callback = inputObject.callback;
  var xhr = new XMLHttpRequest();
  var progressMessage = `${theAddress} POST ${inputObject.messageBody}`;
  recordProgressStarted(progress, progressMessage, (new Date()).getTime(), true);

  xhr.open("POST", theAddress, true);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

  xhr.onload = function () {
    recordProgressDone(progress);
    if (callback !== undefined && callback !== null) {
      callback(xhr.responseText, result);
    } else { 
      recordResult(xhr.responseText, result);
    }
  };
  xhr.send(inputObject.messageBody);
}

module.exports = {
  submitGET,
  submitPOST,
  buttonProgressClick,
  getToggleButton,
  getToggleButtonPausePolling,
  deleteParent,
  updateInnerHtml,
  updateValue,
  highlightInput,
  highlightError
}