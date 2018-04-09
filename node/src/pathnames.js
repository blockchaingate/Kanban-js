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
