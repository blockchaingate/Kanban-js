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
  frontEndCSS: `${path.HTML}/kanban_frontend.css`,
};

var url = {};
url.known = {
  faviconIco : "/favicon.ico",
  frontEndBrowserifiedJS: "/kanban_frontend_browserified.js",
  frontEndHTML: "/kanban_frontend.html",
  frontendCSS: "/kanban_style.css",
  rpc: "/rpc",
  rpcWithQuery: "/rpc?command="
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
