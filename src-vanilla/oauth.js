"use strict";
const pathnames = require('./pathnames');
const jwt = require('jsonwebtoken');
const https = require('https');
const crypto = require('crypto');


function OAuthGoogleLogin() {
  this.endPoint = pathnames.oauth.endPoint;
  this.clientId = pathnames.oauth.clientId;
  this.certificateURL = `https://www.googleapis.com/oauth2/v1/certs`;
  this.verifiedGoogleTokens = {};
  this.authenticationTokens = {};
  this.knownKeys = {};
  this.authorityLabel = "fa.biz";
}

OAuthGoogleLogin.prototype.loginWithAuthenticationToken = function (response, result) {
  if (!result.authenticationToken in this.authenticationTokens) {
    result.error =  "Authentication token not found.";
    response.writeHead(400);
    return response.end(JSON.stringify(result));
  }
  result.permissions = this.authenticationTokens[result.authenticationToken];
  result.authenticated = true;
  response.writeHead(200);
  response.end(JSON.stringify(result));
}

OAuthGoogleLogin.prototype.login = function (response, query) {
  var result = {};
  result.authenticated = false;
  if (
    query.authenticationToken !== undefined && 
    query.authenticationToken !== "" && 
    query.authenticationToken !== null
  ) {
    if (query.authenticationToken in this.authenticationTokens) {
      result.authenticationToken = query.authenticationToken;
      return this.loginWithAuthenticationToken(response, result);
    } else {
      query.authenticationToken = null;
    }
  }
  if (query.googleToken === undefined || query.googleToken === null || query.googleToken === "") {
    response.error = "Could not find google authentication token. ";
    response.writeHead(400);
    return response.end(JSON.stringify(result));
  }
  result.googleToken = query.googleToken;
  if (result.googleToken in this.verifiedGoogleTokens) {
    result.authenticated = true;
    result.authenticationToken = this.verifiedGoogleTokens[query.googleToken];
    result.permissions = this.authenticationTokens[result.authenticationToken];
    response.writeHead(200);
    return response.end(JSON.stringify(result));  
  }

  if (query.testTampering === true || query.testTampering === "true") {
    result.testTampering = true;
  }
  var splitToken = result.googleToken.split(".");
  if (splitToken.length != 3) {
    result.error = "Token has the wrong number of dots. ";
    response.writeHead(400);
    return response.end(JSON.stringify(result));
  }
  try {
    var firstPartDecoded = Buffer.from(splitToken[0], 'base64');
    var firstPartParsed = JSON.parse(firstPartDecoded.toString());
    if (firstPartParsed.kid === null || firstPartParsed.kid === undefined) {
      result.error = `First part of json token appears to be missing the kid entry. `;
      response.writeHead(400);
      return response.end(JSON.stringify(result));
    }
    result.keyId = firstPartParsed.kid;
    if (firstPartParsed.kid in this.knownKeys) {
      return this.verifyTokenAgainstKey(response, result, query.googleToken, this.knownKeys[firstPartParsed.kid]);
    } 
    return this.fetchKeyAndVerify(response, result);
  } catch (e) {
    result.error = `Failed to process google token. ${e}`;
    response.writeHead(400);
    return response.end(JSON.stringify(result));
  }
}

OAuthGoogleLogin.prototype.providerKeyFetchGetResponse = function (response, resultSoFar, providerResponse) {
  providerResponse.on('data', this.appendFetchedKey.bind(this, resultSoFar));
  providerResponse.on('end', this.processFetchedKey.bind(this, response, resultSoFar));
}

OAuthGoogleLogin.prototype.handleErrorStandard = function(response, resultSoFar, theError) {
  response.writeHead(500);
  resultSoFar.error = `Failed to fetch google keys. ${theError}`;
  response.end(JSON.stringify(resultSoFar));
}

OAuthGoogleLogin.prototype.appendFetchedKey = function (resultSoFar, data) {
  resultSoFar.fetchedKey += data.toString();
}

OAuthGoogleLogin.prototype.fetchKeyAndVerify = function(response, resultSoFar) {
  resultSoFar.fetchedKey = "";
  var getter = https.get(this.certificateURL, this.providerKeyFetchGetResponse.bind(this, response, resultSoFar));
  getter.on('error', this.handleErrorStandard.bind(this, response, resultSoFar));
}

OAuthGoogleLogin.prototype.processFetchedKey = function(response, resultSoFar) {
  var keyId = resultSoFar.keyId;
  try {
    resultSoFar.parsedKeys = JSON.parse(resultSoFar.fetchedKey);
    if (! keyId in resultSoFar.parsedKeys) {
      resultSoFar.error = `Your authentication token claims google public key id: ${keyId}`;
      resultSoFar.error += ` but I could not find that in the fetched google keys: ${fetchedKey}`;
      response.writeHead(400);
      response.end(JSON.stringify(resultSoFar));  
    }
    this.knownKeys[keyId] = resultSoFar.parsedKeys[keyId];
  } catch (e) {
    resultSoFar.error = `Failed to process google public key. ${e}. `;
    response.writeHead(500);
    response.end(JSON.stringify(resultSoFar));
  }
  resultSoFar.key = this.knownKeys[keyId];
  return this.verifyTokenAgainstKey(response, resultSoFar);
}

OAuthGoogleLogin.prototype.verifyTokenAgainstKey = function (response, result) {
  var keyId = result.keyId;
  try {
    result.verification = jwt.verify(result.googleToken, this.knownKeys[keyId]);
    if (result.testTampering) {
      var tamperChar = 1246;
      var tamperedWithToken = result.googleToken.slice(0, tamperChar) + 's' +  result.googleToken.slice(tamperChar + 1);
      result.verification = jwt.verify(tamperedWithToken, result.key);
    }
    result.authenticated = true;
  } catch (e) {
    result.error = `Error: ${e}`;
    result.authenticated = false;
  }
  if (result.authenticated === true) {
    var newToken = crypto.randomBytes(32).toString('base64');
    this.verifiedGoogleTokens[result.googleToken] = newToken;
    this.authenticationTokens[newToken] = "unknown";
    var email = result.verification.email; 
    if (typeof email === "string") {
      if (result.verification.email.endsWith(this.authorityLabel)) {
        this.authenticationTokens[newToken] = this.authorityLabel;
      } else {
        var emailSplit = email.split("@");
        var emailSecondPart = emailSplit[1];
        if (typeof emailSecondPart !== "string") {
          emailSecondPart = "[could not extract domain]";
        }
        this.authenticationTokens[newToken] = `non-registered group: ${emailSecondPart}`;
      }
    }
    result.authenticationToken = newToken;
    result.permissions = this.authenticationTokens[newToken];
  }
  response.writeHead(200);
  response.end(JSON.stringify(result));
}

var oAuthGoogle = new OAuthGoogleLogin();
module.exports = {
  oAuthGoogle,
}

