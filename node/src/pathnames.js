"use strict";
var path = {};
path.certificates = __dirname + "/" + "../certificates_secret";
path.HTML = __dirname + "/../html";
var pathname = {};
pathname.privateKey = `${path.certificates}/private_key.pem`;
pathname.certificate = `${path.certificates}/certificate.pem`;
pathname.faviconIco = `${path.HTML}/favicon.ico`;

var url = {};
url.whiteListedFiles = {};
url.whiteListedFiles["/favicon.ico"] = `${path.HTML}/favicon.ico`;

module.exports = {
  pathname,
  path,
  url
}
