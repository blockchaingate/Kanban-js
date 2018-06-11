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
          formattedData += `<b style='color:red'>${data}</b>`;
          response.write(formattedData);
          //console.log('STDERR: ' + data);
        });
      });
    }).connect({
      host: theMachine.ipAddress,
      port: 22,
      username: theMachine.user,
      privateKey: getSSHKeyFromMachine(theMachine)
    });
  } catch (e) {
    response.writeHead(200);
    response.end(`Error while trying to ssh into machine: ${machineName}. ${e}`);
  }
}

function sshNodeToOneRemoteMachineGitPull(request, response, desiredCommand) {
  readSecretsAdminConfiguration(sshNodeToRemoteMachineExecuteCommands.bind(
    null, desiredCommand.machineName, "cd Kanban\ngit pull\nnpm install\ncd fabcoin\ngit pull", response
  ));
}

function sshNodeToOneRemoteMachineKillallFabcoind(request, response, desiredCommand) {
  readSecretsAdminConfiguration(sshNodeToRemoteMachineExecuteCommands.bind(
    null, desiredCommand.machineName, "killall fabcoind", response
  ));
}

function sshNodeToOneRemoteMachineNodeRestart(request, response, desiredCommand) {
  readSecretsAdminConfiguration(sshNodeToRemoteMachineExecuteCommands.bind(
    null, desiredCommand.machineName, "cd Kanban\nnpm run daemonStop\nnpm run daemonStart", response
  ));
}

function sshNodeToOneRemoteMachineStartFabcoind(request, response, desiredCommand) {
  var theNet = desiredCommand.net;
  console.log(`DEBUG: Desired command net: ${theNet}`);
  readSecretsAdminConfiguration(sshNodeToRemoteMachineExecuteCommands.bind(
    null, desiredCommand.machineName, `cd Kanban/fabcoin/src\n./fabcoind ${theNet} --daemon`, response
  ));
}

module.exports = {
  fetchNodeInfo,
  sshNodeToOneRemoteMachineGitPull,
  sshNodeToOneRemoteMachineKillallFabcoind,
  sshNodeToOneRemoteMachineNodeRestart,
  sshNodeToOneRemoteMachineStartFabcoind
}