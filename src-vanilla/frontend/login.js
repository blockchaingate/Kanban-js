"use strict";
const submitRequests = require('./submit_requests');
const ids = require('./ids_dom_elements');
const pathnames = require('../pathnames');
const jwt = require('jsonwebtoken');

function LoginFrontend() {
  this.googleAuth = null;
  this.authenticationToken = "";
  this.authReponse = null;
  this.googleToken = "";
  this.decodedToken = null;
}

LoginFrontend.prototype.signOut = function() {
  gapi.auth2.getAuthInstance().signOut();
  this.googleToken = "";
  this.decodedToken = null;
}

LoginFrontend.prototype.callbackLoginServer = function (input, output) {
  var inputParsed = JSON.parse(input);
  var loginStatus = document.getElementById(ids.defaults.login.spanSignedInStatus);
  var spanPermissions = document.getElementById(ids.defaults.login.spanPermissions);
  var profilePicture = document.getElementById(ids.defaults.login.divProfilePicture);
  console.log(this.authReponse);
  if (inputParsed.authenticated === true) {
    loginStatus.innerHTML = `<b style = 'color:green'>Signed in</b>`;
    spanPermissions.innerHTML = `origin: <b>${inputParsed.permissions}</b>`;
    if (this.decodedToken === null) {
      this.decodedToken = jwt.decode(this.googleToken);
      console.log("DEBUG: Stringified: " + JSON.stringify(this.decodedToken));
    }
    if (this.decodedToken !== null && this.decodedToken !== undefined) {
      profilePicture.innerHTML = `<img src = "${this.decodedToken.picture}"></img>`;
    }
  } else {
    loginStatus.innerHTML = `<b style = 'color:red'>Token not verified</b>`;
    spanPermissions.innerHTML = "";
    profilePicture.innerHTML = "";
    this.signOut();
  }
  if (inputParsed.authenticationToken !== "" && inputParsed.authenticationToken !== null && inputParsed.authenticationToken !== undefined) {
    this.authenticationToken = inputParsed.authenticationToken;
  }
}

LoginFrontend.prototype.callbackLoginGoogle = function (nonParsedToken) {
  this.authReponse = nonParsedToken.getAuthResponse();
  this.googleToken = this.authReponse.id_token;
  this.decodedToken = null;
  var theURL = pathnames.url.known.login;
  theURL += `?googleToken=${this.googleToken}`;
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
    ids.defaults.login.buttonLogin, {
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