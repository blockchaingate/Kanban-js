"use strict";
const pathnames = require('./pathnames');
const path = require('path');
const fs = require('fs');


function initializeFolders() {
  var currentPath = pathnames.path.base + "/";
  while (currentPath !== "/") {
    var currentPathFabcoin = currentPath + ".fabcoin";
    var currentPathKanban = currentPath + ".kanban";
    //console.log("DEBUG: trying current path: " + currentPath + ", fab path: " + currentPathFabcoin);
    if (fs.existsSync(currentPathFabcoin)) {
      pathnames.path.fabcoinConfigurationFolder = path.normalize(currentPathFabcoin);
      var networkData = pathnames.networkData;
      console.log(`Using fabcoin configuration folder: ${pathnames.path.fabcoinConfigurationFolder}`.green);
      pathnames.url.whiteListed[pathnames.url.known.logFileTestNetNoDNS] = `${pathnames.path.fabcoinConfigurationFolder}/${networkData.testNetNoDNS.folder}debug.log`;
      pathnames.url.whiteListed[pathnames.url.known.logFileTestNetNoDNSSession] = `${pathnames.path.fabcoinConfigurationFolder}/${networkData.testNetNoDNS.folder}debug_session.log`;
      pathnames.url.whiteListed[pathnames.url.known.logFileTestNet] = `${pathnames.path.fabcoinConfigurationFolder}/${networkData.testNet.folder}debug.log`;
      pathnames.url.whiteListed[pathnames.url.known.logFileTestNetSession] = `${pathnames.path.fabcoinConfigurationFolder}/${networkData.testNet.folder}debug_session.log`;
      pathnames.url.whiteListed[pathnames.url.known.logFileMainNet] = `${pathnames.path.fabcoinConfigurationFolder}/debug.log`;
      pathnames.url.whiteListed[pathnames.url.known.logFileMainNetSession] = `${pathnames.path.fabcoinConfigurationFolder}/debug_session.log`;
    }
    if (fs.existsSync(currentPathKanban)) {
      pathnames.path.kanbanProofOfConcentConfigurationFolder = path.normalize(currentPathKanban);
      //var networkDataKanban = pathnames.networkDataKanban;
      console.log(`Using Kanban++ configuration folder: ${pathnames.path.kanbanProofOfConcentConfigurationFolder}`.blue);
    }
    if (pathnames.path.kanbanProofOfConcentConfigurationFolder !== null && pathnames.path.fabcoinConfigurationFolder !== null) {
      break;
    }
    currentPath = path.normalize(currentPath + "../");
  }
  if (pathnames.path.fabcoinConfigurationFolder === null) {
    console.log("Was not able to find the fabcoin configuration folder .fabcoin in any of the parent folders. ".red);
  } else {
    pathnames.pathsComputedAtRunTime.fabcoinConfigurationFolder = pathnames.path.fabcoinConfigurationFolder;
  }
  if (pathnames.path.kanbanProofOfConcentConfigurationFolder === null) {
    console.log("Was not able to find the Kanban++ configuration folder .kanban in any of the parent folders. ".red);
  } else {
    pathnames.pathsComputedAtRunTime.kanbanProofOfConcentConfigurationFolder = pathnames.path.kanbanProofOfConcentConfigurationFolder;
  }
}

function initializeAuthenticationCookie(networkName, callback) {
  var desiredCookieFileName = `${pathnames.pathsComputedAtRunTime.fabcoinConfigurationFolder}/${pathnames.networkData[networkName].folder}.cookie`;
  console.log(`desired cookie file name: ${desiredCookieFileName}`);
  if (fs.readFile(desiredCookieFileName, function(error, data) {
    if (error) {
      console.log(`Error reading authentication cookie for network: ` + `${networkName}`.red + ` ${error}`.yellow);
    } else {
      pathnames.networkData[networkName].auth = data;      
    }
    console.log(`Read authentication cookie ` + `${data}`.red + ` for network ` + `${networkName}`.blue);
    callback();
  }));
}

module.exports = {
  initializeFolders, 
  initializeAuthenticationCookie
}