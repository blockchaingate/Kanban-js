"use strict";
const pathnames = require('./pathnames');
const assert = require('assert')
const childProcess = require('child_process');
const globals = require('./globals');
const fs = require('fs');

var SSHClient = require('ssh2').Client;

var configurationSecretsAdminContent = null;

function readSecretsAdminConfiguration(callbackFunction) {
  if (configurationSecretsAdminContent !== null) {
    if (callbackFunction !== undefined && callbackFunction !== null) {
      return callbackFunction();
    }
    return;
  }
  fs.readFile(pathnames.pathname.configurationSecretsAdmin, function (error, data) {
    if (error) {
      configurationSecretsAdminContent = {};
      configurationSecretsAdminContent.error = `Failed to read configuration file ${pathnames.pathname.configurationSecretsAdmin} with error: ${error}. `;
      return;
    }
    try {
      configurationSecretsAdminContent = JSON.parse(data);
    } catch (e) {
      configurationSecretsAdminContent = {};
      configurationSecretsAdminContent.error = `I was able to read ${pathnames.pathname.configurationSecretsAdmin} but could not parse it. Error: ${error}. `;
    }

    if (callbackFunction !== undefined && callbackFunction !== null) {
      return callbackFunction();
    }
  });
}

function fetchNodeInfoPartTwo(request, response, desiredCommand) {
  response.writeHead(200);
  response.end(JSON.stringify(configurationSecretsAdminContent));
}

function fetchNodeInfo(request, response, desiredCommand) {
  readSecretsAdminConfiguration(fetchNodeInfoPartTwo.bind(null, request, response, desiredCommand));
}

function sshNodeToRemoteMachinePartFour(machineName, stdoutSoFar, response) {
  response.writeHead(200);
  response.end(stdoutSoFar);
}

function getSSHKeyFromMachine(theMachine) {
  if (theMachine.sshKey !== null && theMachine.sshKey !== undefined && typeof theMachine.sshKey === "string") {
    return theMachine.sshKey;
  }
  if (theMachine.sshKeySameAs !== undefined) {
    return configurationSecretsAdminContent.myNodes[theMachine.sshKeySameAs].sshKey;
  }
}

function sshNodeToRemoteMachineExecuteCommands(machineName, theCommand, response) {
  if (!(machineName in configurationSecretsAdminContent.myNodes)) {
    response.writeHead(200);
    response.end(`Machine name: ${machineName} not found. `);
    return;
  }
  try {
    var theMachine = configurationSecretsAdminContent.myNodes[machineName];
    var theConnection = new SSHClient();
    theConnection.on('ready', function() {
      response.writeHead(200);
      response.write(`<span style='color:blue'>SSH connection to ${machineName} ready.<br>Proceeding to execute: ${theCommand}</span><br>`);
      var gotData = false;
      theConnection.exec(theCommand, function(err, stream) {
        if (err) { 
          throw err;
        }
        stream.on('close', function(code, signal) {
          //console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          response.end();
          theConnection.end();
        }).on('data', function(data) {
          var formattedData = "";
          if (gotData) {
            formattedData += "<br>";
          }
          gotData = true;
          formattedData += `<b style='color:green'>${data}</b>`;
          response.write(formattedData);
          //console.log('STDOUT: ' + data);
        }).stderr.on('data', function(data) {
          var formattedData = "";
          if (gotData) {
            formattedData += "<br>";
          }
          gotData = true;
          formattedData += `<b style='color:orange'>${data}</b>`;
          response.write(formattedData);
          //console.log('STDERR: ' + data);
        });
      });
    }).on('error', function(theError) {
      response.writeHead(200);
      response.end(`<b style='color:red'>Error connecting. ${theError}</b>`);
    }).connect({
      host: theMachine.ipAddress,
      port: 22,
      username: theMachine.user,
      privateKey: getSSHKeyFromMachine(theMachine),
      readyTimeout: 5000 //<- 5 second timeout
    });
  } catch (e) {
    response.writeHead(200);
    response.end(`Error while trying to ssh into machine: ${machineName}. ${e}`);
  }
}

function sshNodeToOneRemoteMachineGitPull(request, response, desiredCommand) {
  readSecretsAdminConfiguration(sshNodeToRemoteMachineExecuteCommands.bind(
    null, desiredCommand.machineName, "cd Kanban\ngit reset HEAD --hard\ngit pull\nnpm install\ncd fabcoin\ngit pull", response
  ));
}

function sshNodeToOneRemoteMachineKillallFabcoind(request, response, desiredCommand) {
  readSecretsAdminConfiguration(sshNodeToRemoteMachineExecuteCommands.bind(
    null, desiredCommand.machineName, "killall fabcoind", response
  ));
}

function sshNodeToOneRemoteMachineNodeRestart(request, response, desiredCommand) {
  //Command explanation.
  //1. npm run daemonStop <- stops the npm daemon via runs daemon.js, for more details see also package.json.
  //2. killall node <- kills node if it didn't stop properly. Should not happen, but has happened due to programming mistakes of mine.
  //3. lsof -i tcp:${pathnames.ports.https} | awk 'NR!=1 {print $2}' | xargs kill
  //Kills all listeners to the https port. 
  //For more explanation on the command see 
  //https://stackoverflow.com/questions/5043808/how-to-find-processes-based-on-port-and-kill-them-all
  //Copied from the aforementioned site:
  //3.1 (lsof -i tcp:${PORT_NUMBER}) -- list all processes that is listening on that tcp port.
  //3.2 (awk 'NR!=1 {print $2}') -- ignore first line, print second column of each line.
  //3.3 (xargs kill) -- pass on the results as an argument to kill. There may be several. 
  //4. npm run daemonStart <- the start counterpart of command 1)
  //
  //`cd Kanban\nnpm run daemonStop\nkillall node\nlsof -i tcp:${pathnames.ports.https} | awk 'NR!=1 {print $2}' | xargs kill\nnpm run daemonStart`
  //
  readSecretsAdminConfiguration(sshNodeToRemoteMachineExecuteCommands.bind(
    null, 
    desiredCommand.machineName, 
    `cd Kanban\nnpm run daemonStop\nnpm run daemonStart`, 
    response
  ));
}

function sshNodeToOneRemoteMachineStartFabcoind(request, response, desiredCommand) {
  var theNet = desiredCommand.net;
  readSecretsAdminConfiguration(sshNodeToRemoteMachineExecuteCommands.bind(
    null, desiredCommand.machineName, `cd Kanban/fabcoin/src\n./fabcoind ${theNet} --daemon -profilingon`, response
  ));
}

function sshNodeToOneRemoteMachineDeleteFabcoinConfiguration(request, response, desiredCommand) {
  var theFolder = "";
  var theNet = pathnames.getNetworkDataFromRPCNetworkOption(desiredCommand.net);
  if (theNet !== null && theNet !== undefined) {
    theFolder = theNet.folder;
  } 
  console.log(`About to wipe folder: ${theFolder}` );
  readSecretsAdminConfiguration(sshNodeToRemoteMachineExecuteCommands.bind(
    null, desiredCommand.machineName, `rm -r .fabcoin/${theFolder}`, response
  ));
}

function sshNodeToOneRemoteMachineGitPullMakeFab(request, response, desiredCommand) {
  readSecretsAdminConfiguration(sshNodeToRemoteMachineExecuteCommands.bind(
    null, desiredCommand.machineName, `cd Kanban/fabcoin\ngit pull\nmake -j4`, response
  ));
}

module.exports = {
  fetchNodeInfo,
  sshNodeToOneRemoteMachineGitPull,
  sshNodeToOneRemoteMachineKillallFabcoind,
  sshNodeToOneRemoteMachineNodeRestart,
  sshNodeToOneRemoteMachineStartFabcoind,
  sshNodeToOneRemoteMachineDeleteFabcoinConfiguration,
  sshNodeToOneRemoteMachineGitPullMakeFab
}