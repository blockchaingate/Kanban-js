"use strict";
const pathnames = require('./pathnames');
const path = require('path');
const fs = require('fs');


function initializeFolders() {
  var currentPath = pathnames.path.base + "/";
  while (currentPath !== "/") {
    var currentPathFabcoin = currentPath + ".fabcoin";
    //console.log("DEBUG: trying current path: " + currentPath + ", fab path: " + currentPathFabcoin);
    if (fs.existsSync(currentPathFabcoin)) {
      pathnames.path.fabcoinConfigurationFolder = currentPathFabcoin;
      pathnames.path.fabcoinConfigurationFolder = path.normalize(pathnames.path.fabcoinConfigurationFolder);
      console.log(`Using fabcoin configuration folder: ${pathnames.path.fabcoinConfigurationFolder}`.green);
      pathnames.url.whiteListed[pathnames.url.known.logFileTestNet] = `${pathnames.path.fabcoinConfigurationFolder}/testnet3/debug.log`;
      pathnames.url.whiteListed[pathnames.url.known.logFileTestNetSession] = `${pathnames.path.fabcoinConfigurationFolder}/testnet3/debug_session.log`;
      pathnames.url.whiteListed[pathnames.url.known.logFileMainNet] = `${pathnames.path.fabcoinConfigurationFolder}/debug.log`;
      pathnames.url.whiteListed[pathnames.url.known.logFileMainNetSession] = `${pathnames.path.fabcoinConfigurationFolder}/debug_session.log`;
      break;
    }
    currentPath = path.normalize(currentPath + "../");
  }
  if (pathnames.path.fabcoinConfigurationFolder === null) {
    console.log("Was not able to find the fabcoin configuration folder .fabcoin in any of the parent folders. ".red);
  }
}

module.exports = {
  initializeFolders
}