"use strict";
const submitRequests = require('./submit_requests');
const ids = require('./ids_dom_elements');
const pathnames = require('../pathnames');

function LoginFrontend() {
  this.googleAuth = null;
  this.authenticationToken = "";
}

LoginFrontend.prototype.signOut = function() {
  gapi.auth2.getAuthInstance().signOut();
}

LoginFrontend.prototype.callbackLoginServer = function (input, output) {
  var inputParsed = JSON.parse(input);
  console.log("DEBUG: stringified token: " + JSON.stringify(inputParsed));
  var loginStatus = document.getElementById(ids.defaults.divLoginWithServer);
  if (inputParsed.authenticated === true) {
    loginStatus.innerHTML = `<b style = 'color:green'>Token verified, permissions: ${inputParsed.permissions}.</b>`;
  } else {
    loginStatus.innerHTML = `<b style = 'color:red'>Token not verified</b>`;
  }
  if (inputParsed.authenticationToken !== "" && inputParsed.authenticationToken !== null && inputParsed.authenticationToken !== undefined) {
    this.authenticationToken = inputParsed.authenticationToken;
  }
}

LoginFrontend.prototype.callbackLoginGoogle = function (nonParsedToken) {
  var theToken = nonParsedToken.getAuthResponse().id_token;
  var theURL = pathnames.url.known.login;
  theURL += `?googleToken=${theToken}`;
  //theURL += `?googleToken=${theToken}&testTampering=true`;
  submitRequests.submitGET({
    url: theURL,
    progress: ids.defaults.progressReport,
    callback: this.callbackLoginServer.bind(this),
    result: null
  });
  //console.log("DEBUG: non parsed token: " + theToken);
}

LoginFrontend.prototype.callbackLoginGoogleError = function (error) {
  console.log ("Google login error: " + JSON.stringify(error));
}

LoginFrontend.prototype.gapiLoadCallback = function() {
  console.log("Got to gapi ...");
  this.googleAuth = gapi.auth2.init({
    client_id: pathnames.oauth.clientId,
    cookiepolicy: 'single_host_origin',
  });
  gapi.signin2.render(
    ids.defaults.buttonLogin, {
      'onsuccess': this.callbackLoginGoogle.bind(this),
      'onfailure': this.callbackLoginGoogleError.bind(this),
    }
  );
}

//LoginFrontend.prototype.loginSequenceCallback = function(input, output) {
//  console.log("DEBUG: got to here. input, output: " + JSON.stringify(input) + ", " + JSON.stringify(output));
//  window.open(input, "_blank", "width = 600, height = 400");
//}
//
//LoginFrontend.prototype.loginSequenceStart = function() {
//
//
//  var theURL = pathnames.url.known.login.firstUserRequestToUs;
//  submitRequests.submitGET({
//    url: theURL,
//    progress: ids.defaults.progressReport,
//    callback: this.loginSequenceCallback.bind(this),
//    result: null,
//  });
//}

var login = new LoginFrontend();

module.exports = {
  login
}