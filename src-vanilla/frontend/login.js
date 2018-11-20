"use strict";

function LoginFrontend() {

}

LoginFrontend.prototype.loginSequenceStart = function() {
  console.log("Here I am");
}

var login = new LoginFrontend();

module.exports = {
  login
}