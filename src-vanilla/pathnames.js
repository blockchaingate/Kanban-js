"use strict";

var ports = { 
  https: 52907,
  http: 51846
};

const pathBuiltIn = require('path');

var path = {
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
  faviconIco: `${path.HTML}/favicon.ico`,
  fabcoinSvg: `${path.HTML}/fabcoin.svg`,
  frontEndBrowserifiedJS: `${path.HTML}/kanban_frontend_browserified.js`,
  frontEndNONBrowserifiedJS: `${__dirname}/frontend/frontend.js`,
  frontEndHTML: `${path.HTML}/kanban_frontend.html`,
  frontEndCSS: `${path.HTML}/kanban_frontend.css`,
  fabcoind: `${path.fabcoinSrc}/fabcoind`,
  fabcoinCli: `${path.fabcoinSrc}/fabcoin-cli`,
  kanbanCli: `${path.kanbanProofOfConceptSRC}/fabcoin-cli`,
  kanband: `${path.kanbanProofOfConceptSRC}/fabcoind`,
  openCLDriverExecutable: `${path.openCLDriverBuildPath}/kanban-gpu`
};

for (var label in pathname) {
  //console.log(`Debug: path ${pathname[label]} `);
  pathname[label] = pathBuiltIn.normalize(pathname[label]);
  //console.log(`normalized to: ${pathname[label]}`);
}
  
var url = {
  known: {
    ping: "/ping",
    faviconIco: "/favicon.ico",
    fabcoinSvg: "/fabcoin.svg",
    frontEndBrowserifiedJS: "/kanban_frontend_browserified.js",
    frontEndHTML: "/kanban_frontend.html",
    frontEndCSS: "/kanban_frontend.css",
    rpc: "/rpc",
    kanbanRPC: "/kanbanRPC",
    goKanbanRPC: "/goKanbanRPC",
    computationEngine: "/computation_engine",
    fabcoinInitializationOLD: "/fabcoin_initialization",
    kanbanInitialization: "/go_kanban_initialization",
    myNodesCommand: "/my_nodes",
    logFileTestNetNoDNS: "/logFileTestNetNoDNS",
    logFileTestNetNoDNSSession: "/logFileTestNetNoDNSSession",
    logFileTestNet: "/logFileTestNet",
    logFileTestNetSession: "/logFileTestNetSession",
    logFileMainNet: "/logFileMainNet",
    logFileMainNetSession: "/logFileMainNetSession",
  },
  whiteListed: {

  }
};

url.whiteListed = {};
url.whiteListed[url.known.faviconIco] = pathname.faviconIco;
url.whiteListed[url.known.fabcoinSvg] = pathname.fabcoinSvg;
url.whiteListed[url.known.frontEndBrowserifiedJS] = pathname.frontEndBrowserifiedJS;
url.whiteListed[url.known.frontEndHTML] = pathname.frontEndHTML;
url.whiteListed[url.known.frontEndCSS] = pathname.frontEndCSS;


url.synonyms = {
  "/" : url.known.frontEndHTML
};

module.exports = {
  pathname,
  path,
  ports,
  url,
}
