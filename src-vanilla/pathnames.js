"use strict";

var ports = { 
  https: 52907,
  http: 51846
};

const pathBuiltIn = require('path');

var path = {
  src: __dirname,
  base: `${__dirname}/..`,
  secretsServerOnly: `${__dirname}/../secrets_server_only`,
  secretsAdmin: `${__dirname}/../secrets_admin`,
  HTML: `${__dirname}/../html`,
  fabcoin: `${__dirname}/../fabcoin`,
  fabcoinSrc: `${__dirname}/../fabcoin/src`,
  kanbanProofOfConcept: `${__dirname}/../kanban-poc`,
  kanbanProofOfConceptSRC: `${__dirname}/../kanban-poc/src`,
  openCLDriverBuildPath: `${__dirname}/../build`,
  fabcoinConfigurationFolder: null,
  kanbanProofOfConcentConfigurationFolder: null
};

for (var label in path) {
  //console.log(`Debug: path ${path[label]} `);
  if (path[label] === null) {
    continue;
  }
  path[label] = pathBuiltIn.normalize(path[label]);
//  console.log(`normalized to: ${path[label]}`);
}

var pathname = {
  privateKey: `${path.secretsServerOnly}/private_key.pem`,
  certificate: `${path.secretsServerOnly}/certificate.pem`,
  configurationSecretsAdmin: `${path.secretsAdmin}/configuration.json`,
  configurationStorageAdmin: `${path.secretsAdmin}/storage.json`,
  frontEndNONBrowserifiedJS: `${path.src}/frontend/frontend.js`,
  frontEndBrowserifiedJS: `${path.HTML}/kanban_frontend_browserified.js`,
  fabcoind: `${path.fabcoinSrc}/fabcoind`,
  fabcoinCli: `${path.fabcoinSrc}/fabcoin-cli`,
  kanbanCli: `${path.kanbanProofOfConceptSRC}/fabcoin-cli`,
  kanband: `${path.kanbanProofOfConceptSRC}/fabcoind`,
  openCLDriverExecutable: `${path.openCLDriverBuildPath}/kanban-gpu`
};

var frontEnd = {
  favicon: "favicon.ico",
  fabcoinLogoSVG: "fabcoin.svg",
  browserifiedJS: `kanban_frontend_browserified.js`,
  html: `kanban_frontend.html`,
  css: `kanban_frontend.css`,
  ace: `ace/ace.js`,
  aceSearchBox: `ace/ext-searchbox.js`
};

var url = {
  known: {
    ping: "/ping",
    fabcoin: {
      rpc: "/fabcoin_rpc",
      initialization: "/fabcoin_initialization",
    },
    kanbanGO: {
      rpc: "/kanbanGO_RPC",
      initialization: "/kanbanGO_initialization"
    },
    kanbanCPP: { 
      rpc: "/kanbanCPP_RPC"
    },
    login: "/login",
  },
  whiteListed: {
  }
};

var oauth = {
  endPoint: `https://accounts.google.com/o/oauth2/v2/auth`,
  clientId: `68384649778-ukgebobv1gt6rkhgs99n1h2jjgb1qo7j.apps.googleusercontent.com`,
};

for (var resourceLabel in frontEnd) {
  var baseName = frontEnd[resourceLabel];
  var currentLabel = `/html/${baseName}`; 
  var currentFile = `${path.HTML}/${baseName}`;
  url.whiteListed[currentLabel] =  currentFile;
}

url.synonyms = {
  "/" : "/html/kanban_frontend.html",
  "/favicon.ico" : "/html/favicon.ico"
};

module.exports = {
  oauth,
  pathname,
  path,
  ports,
  url,
}
