"use strict";
const pathnames = require('./pathnames');

function OAuthGoogleLogin() {
  this.endPoint = `https://accounts.google.com/o/oauth2/v2/auth`;
  this.clientId = `68384649778-ukgebobv1gt6rkhgs99n1h2jjgb1qo7j.apps.googleusercontent.com`;
}

OAuthGoogleLogin.prototype.handleLogin = function (response, query) {
  var incomingURL = this.endPoint;
  var redirectURI = `https://${query.hostname}/${pathnames.url.known.login.redirectFromProviderToUs}`;
  var redirectURIencoded = encodeURIComponent(redirectURI);
  incomingURL += `?redirect_uri=${redirectURIencoded}`;
  incomingURL += `&client_id=${this.clientId}`;
  var scopesNonEncoded = "email profile";
  incomingURL += `&scope=${encodeURIComponent(scopesNonEncoded)}`;
  response.writeHead(200);
  response.end(incomingURL);
}

var oAuthGoogle = new OAuthGoogleLogin();
module.exports = {
  oAuthGoogle,
}

