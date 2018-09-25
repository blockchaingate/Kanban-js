/** 
 * @module handlersKanbanGoInitialization 
 * @exports KanbanGoInitializer
*/
"use strict";

const url  = require('url');
const queryString = require('querystring');
const kanbanGOInitialization = require('./resources_kanban_go_initialization');
const pathnames = require('./pathnames');
const childProcess = require("child_process");
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const rimraf = require('rimraf');
const cryptoKanban = require('./crypto/crypto_kanban');
require('colors');

/**
 * Returns the ambient kanbanGOInitializer.
 * @returns {KanbanGoInitializer}
 */
function getInitializer() {
  return global.kanban.kanbanGOInitializer;
}

function NodeKanbanGo(inputId) {
  this.id = inputId;
  this.notes = "";
  this.fileNameNodeAddress = null;
  /**@type {string} */
  this.ethereumAddressFileContent = null;
  /** @type {{address: string}} */
  this.ethereumAddressFileParsed = null;
  /** @type {string} */
  this.ethereumAddress = null;
  this.nodePrivateKey = new cryptoKanban.CurveExponent();
  /** @type {string} */
  this.nodePublicKeyHex = null;
  /** @type {string} */
  this.nodeAddressHex = null;
  /** @type {string[]} */
  this.nodeConnections = [];
  this.allAddresses = {};
  this.dataDir = `${getInitializer().paths.nodesDir}/node${this.id}`;
  this.lockFileName = `${this.dataDir}/geth/LOCK`;
  this.keyStoreFolder = `${this.dataDir}/keystore`;
  this.nodeKeyDir = `${this.dataDir}/geth`;
  this.nodeKeyFileName = `${this.nodeKeyDir}/nodekey`;
  this.connectionsFileName = `${this.nodeKeyDir}/static-nodes.json`;
  this.port = this.id + 40107;
  this.RPCPort = this.id + 4007;
  this.flagPreviouslyInitialized = true;
  this.flagFoldersInitialized = false;
  this.numberAttemptsToSelectAddress = 0;
  this.maximumAttemptsToSelectAddress = 4;
}

NodeKanbanGo.prototype.initializeFoldersAndKeys = function(response) {
  fs.unlink(this.lockFileName, this.initialize2ReadKeyStore.bind(this, response));
}

NodeKanbanGo.prototype.initialize2ReadKeyStore = function(response, error) {
  fs.readdir(this.keyStoreFolder, this.initialize3SelectAddress.bind(this, response));
}

NodeKanbanGo.prototype.log = function(input) {
  this.notes += `${input}<br>\n`;
  var initializer = getInitializer();
  console.log(`[Node ${this.id}] `[initializer.colors[this.id % initializer.colors.length]] + `${input}`);
}

NodeKanbanGo.prototype.initialize3SelectAddress = function(response, error, fileNames) {
  if (error !== null && error !== undefined) {
    this.log(`Error reading key store directory: ${this.keyStoreFolder}. ${error}`);
    this.flagFoldersWereInitialized = false;
  } else {
    this.log(`Successfully read key store directory: ${this.keyStoreFolder}`);
  }
  this.numberAttemptsToSelectAddress ++;
  if (this.numberAttemptsToSelectAddress > this.maximumAttemptsToSelectAddress) {
    this.log(`${this.numberAttemptsToSelectAddress} failed attempts to select address: aborting.`);
    getInitializer().runNodes2ReadConfig(response);
    return;
  }
  var hasKeys = false;
  if (fileNames !== undefined && fileNames !== null) {
    if (fileNames.length > 0) {
      hasKeys = true;
    }
  }
  if (!hasKeys) {
    this.log(`Found no previously generated keys. Resetting all folders and keys. `);
    this.flagFoldersWereInitialized = false;
    this.initialize5ResetFolders(response);
    return;
  }
  this.fileNameNodeAddress = `${this.keyStoreFolder}/${fileNames[0]}`;
  fs.readFile(this.fileNameNodeAddress, this.initialize4ReadAccountAddress.bind(this, response));
}

NodeKanbanGo.prototype.initialize4ReadAccountAddress = function(response, error, data) {
  if (error !== null && error !== undefined) {
    this.log(`Error reading stored key: ${this.fileNameNodeAddress}. ${error}`);
    this.flagFoldersWereInitialized = false;
    this.initialize5ResetFolders(response);
    return;
  }
  try {
    this.ethereumAddressFileContent = data;
    this.ethereumAddressFileParsed = JSON.parse(this.ethereumAddressFileContent);
    this.ethereumAddress = this.ethereumAddressFileParsed.address;
    this.log(`Successfully read ethereum address: ${this.ethereumAddress}`);
  } catch (e) {
    this.log(`Error while parsing key file. ${error}. The key file content: ${data}`);
    this.initialize5ResetFolders(response);
    return;
  }
  this.flagFoldersInitialized = true;
  fs.readFile(this.nodeKeyFileName, (err, data)=>{
    if (err !== null && err !== undefined) {
      this.log(`Error reading node key: ${this.nodeKeyFileName}. ${error}`);
      this.flagFoldersWereInitialized = false;
      this.initialize5ResetFolders(response);
      return;
    }
    this.nodePrivateKey.fromArbitrary(data);
    this.nodePublicKeyHex = this.nodePrivateKey.getExponent().toHex();
    this.nodeAddressHex = this.nodePrivateKey.getExponent().computeEthereumAddressHex();
    this.log(`Loaded private key from node key file: ${this.nodePrivateKey.toHex()} with corresponding ethereum address: ${this.nodeAddressHex}`);
    getInitializer().numberOfInitializedFolders ++;
    getInitializer().runNodes2ReadConfig(response);
  });
}

NodeKanbanGo.prototype.initialize5ResetFolders = function(response) {
  rimraf(this.dataDir, this.initialize6CreateFolders.bind(this, response));
}

NodeKanbanGo.prototype.initialize6CreateFolders = function(response, error) {
  if (error !== null && error !== undefined) {
    this.log(`Error while deleting folder: ${this.dataDir}. ${error}`);
  } else {
    this.log(`Deleted folder: ${this.dataDir}.`);
  }
  this.log(`Proceding to create account for new node.`);
  var initializer = getInitializer(); 
  var theOptions = {
    cwd: initializer.paths.gethPath,
    env: process.env
  };
  this.flagFoldersWereInitialized = false;
  var theArguments = [
    "--datadir",
    this.dataDir,
    "--networkid",
    initializer.chainId,
    "account",
    "new",
    "--password",
    initializer.paths.passwordEmptyFile
  ];
  initializer.runShell(initializer.paths.geth, theArguments, theOptions, this.id, this.initialize7GenerateKey.bind(this, response));
}

NodeKanbanGo.prototype.getNodeConfig = function () {
  var result = {};
  result.secretKey = this.nodePrivateKey.toHex();
  result.RPCPort = this.RPCPort;
  result.port = this.port;
  result.myURL = this.myEnodeAddress;
  result.myConnections = this.nodeConnections;
  return result;
}

NodeKanbanGo.prototype.initialize7GenerateKey = function(response, error) {
  this.log(`Generated acount in key store. Proceding to generate node key. `);
  this.nodePrivateKey.generateAtRandom();
  fsExtra.ensureDir(this.nodeKeyDir, this.initialize8WriteKey.bind(this, response));
}

NodeKanbanGo.prototype.initialize8WriteKey = function(response, errorDir) {
  if (errorDir !== null && errorDir !== undefined) {
    this.log(`Failed to create directory: ${this.nodeKeyDir}. ${errorDir}`);
    this.initialize2ReadKeyStore(response, null);
    return;
  }
  fs.writeFile(this.nodeKeyFileName, this.nodePrivateKey.toHex(), (errorWrite)=> {
    if (errorWrite !== null && errorWrite !== undefined) {
      this.log(`Error writing node private key: ${errorWrite}.`);
    } else {
      this.log(`Wrote node key file. `);
    }
    this.initialize2ReadKeyStore(response, null);
  });
}

NodeKanbanGo.prototype.initialize9GenesisBlock = function(response) {
  var initializer = getInitializer();
  var theOptions = {
    cwd: initializer.paths.gethPath,
    env: process.env
  };
  this.log(`Proceding to initialize genesis. `);
  this.flagFoldersWereInitialized = false;
  var theArguments = [
    "--datadir",
    this.dataDir,
    "--networkid",
    initializer.chainId,
    "init",
    initializer.paths.pbftConfig
  ];
  initializer.runShell(initializer.paths.geth, theArguments, theOptions, this.id, this.initialize10WriteNodeConnections.bind(this, response));
}

NodeKanbanGo.prototype.computeMyEnodeAddress = function (){
  this.nodeConnections.push(`enode://${this.nodePublicKeyHex}@[::]:${this.port}?discport=0`);
}

NodeKanbanGo.prototype.initialize10WriteNodeConnections = function(response) {
  var initializer = getInitializer();
  this.nodeConnections = [];
  var idsToConnectTo = [this.id - 1, this.id + 1];
  for (var counterId = 0; counterId < idsToConnectTo.length; counterId ++) {
    var currentId = idsToConnectTo[counterId];
    if (currentId < 0 || currentId >= initializer.nodes.length) {
      continue;
    }
    this.nodeConnections.push(initializer.nodes[currentId].myEnodeAddress);
  }
  this.log(`Writing connections: ${JSON.stringify(this.nodeConnections)} to file: ${this.connectionsFileName}`);
  fs.writeFile(this.connectionsFileName, JSON.stringify(this.nodeConnections), (errorConnections)=> {
    //console.log(`DEBUG: did finally write connections`);
    if (errorConnections !== null && errorConnections !== undefined) {
      this.log(`Error writing node connections. ${e}`);
    }
    getInitializer().runNodes6DoRunNodes(response);
  });
}

NodeKanbanGo.prototype.run = function(response) {
  if (!this.flagFoldersInitialized) {
    throw `Fatal error: attempt to run node: ${this.id} without initializing folders first. `;
  }
  var initializer = getInitializer();
  var theOptions = {
    cwd: initializer.paths.gethPath,
    env: process.env
  };
  var theArguments = [
    "--datadir",
    this.dataDir,
    "--nodiscover",
    "--mine",
    "--verbosity",
    4,
    "--networkid",
    initializer.chainId,
    "--syncmode",
    "full",
    "--port",
    this.port.toString(),
    "--rpcport",
    this.RPCPort.toString()
  ];
  initializer.runShell(initializer.paths.geth, theArguments, theOptions, this.id);
  initializer.numberOfStartedNodes ++;
  initializer.runNodesFinish(response);
}

/**
 * All-in one initilizer for geth nodes.
 * @class
 */
function KanbanGoInitializer() {
  this.numberRequestsRunning = 0;
  this.maxRequestsRunning = 4;
  this.handlers = {
    runNodes: {

    }
  };
  this.colors = ["yellow", "green", "blue", "cyan", "magenta"];
  this.paths = {
    geth: "",
    gethPath: "",
    gethProjectBase: "",
    dataDir: "",
    nodesDir: "",
    passwordEmptyFile: "",
    pbftConfigSeed: "",
    pbftConfig: "",
    nodeConfiguration: ""
  };
  this.chainId = 211;
  /** @type {NodeKanbanGo[]} */
  this.nodes = [];
  /** @type {string} */
  this.notes = "";
  this.numberOfAttemptsToLoadPBFTConfiguration = 0;
  this.numberOfInitializedFolders = 0;
  this.numberOfInitializedGenesis = 0;
  this.numberOfStartedNodes = 0;
  /** @type {{config:{chainId: number, pbft:{proposers: string[]}}}}*/
  this.pbftConfigurationSeed = null;
  /** @type {{config:{chainId: number, pbft:{proposers: string[]} }, alloc: Object}}*/
  this.pbftConfiguration = null;
  this.computePaths();
}

KanbanGoInitializer.prototype.log = function(input) {
  this.notes += `${input}<br>\n`;
  console.log(`[KanbanGoInitializer] `.red + `${input}`);
}

KanbanGoInitializer.prototype.handleRequest =  function(request, response) {
  //console.log("DEBUG: kanban go init: " + JSON.stringify(this));
  if (request.method === "GET") {
    return this.handleRPCGET(request, response);
  }
  response.writeHead(400);
  return response.end(`Method not implemented: ${request.method} not implemented. `);
}

KanbanGoInitializer.prototype.handleRPCGET = function(request, response) {
  var parsedURL = null;
  try {
    parsedURL = url.parse(request.url);
  } catch (e) {
    response.writeHead(400);
    return response.end(`In handlers_kanban_go: bad RPC request: ${e}.`);
  }
  return this.handleRPCURLEncodedInput(request, response, parsedURL.query);
}

KanbanGoInitializer.prototype.handleRPCURLEncodedInput = function(request, response, messageBodyURLed) {
  var query = null;
  var queryCommand = null;
  try {
    query = queryString.parse(messageBodyURLed);
    queryCommand = JSON.parse(query.command);
  } catch (e) {
    response.writeHead(400);
    return response.end(`Bad RPC input. ${e}`);
  }
  return this.handleRPCArguments(request, response, queryCommand);
}

KanbanGoInitializer.prototype.computePaths = function() {
  var staringPath = `${pathnames.path.base}/go/src/github.com/blockchaingate/kanban-go/build/bin/`;
  staringPath = path.normalize(staringPath);
  var currentPath = staringPath;
  var maxNumRuns = 100;
  var numRuns = 0;
  var kanbanDataDirName = global.kanban.configuration.kanbanGO.dataDirName;
  while (currentPath !== "/") {
    numRuns ++;
    if (numRuns > maxNumRuns) {
      break;
    }
    if (this.paths.geth === "") {
      var currentPathGeth = currentPath + "geth";
      if (fs.existsSync(currentPathGeth)) {
        this.paths.geth = currentPathGeth;
        this.paths.gethPath = currentPath;
      }
    }
    if (this.paths.dataDir === "") {
      var currentDataDir = currentPath + kanbanDataDirName;
      if (fs.existsSync(currentDataDir)) {
        this.paths.dataDir = currentDataDir;
      }
    }
    if (this.paths.geth !== "" && this.paths.dataDir !== "") {
      break;
    }
    currentPath = path.normalize(currentPath + "../");
  }
  if (this.paths.geth === "") {
    console.log(`Could not find geth executable. Searched directories along: ${staringPath}`.red);
    throw(`Could not find geth executable.`);
  } else {
    console.log(`Found geth executable:`.green + `${this.paths.geth}`.blue);
  }
  if (this.paths.dataDir === "") {
    console.log(`Could not find data directory ${kanbanDataDirName}. Searched directories along: ${staringPath}`.red);
    throw(`Could not find data directory.`);
  } else {
    console.log(`Found data directory: `.green + `${this.paths.dataDir}`.blue);
  }
  this.paths.gethProjectBase = path.normalize(`${this.paths.gethPath}/../../`);
  this.paths.pbftConfig = `${this.paths.dataDir}/pbft.json`;
  this.paths.nodeConfiguration = `${this.paths.dataDir}/node_config.json`;
  this.paths.pbftConfigSeed = `${this.paths.dataDir}/pbft_seed.json`;
  this.paths.passwordEmptyFile = `${this.paths.dataDir}/password_empty.txt`;
  this.paths.nodesDir = `${this.paths.dataDir}/nodes`;
  fs.readFile(this.paths.pbftConfigSeed, (err, data) => {
    this.pbftConfigurationSeed = JSON.parse(data);
  });
}

KanbanGoInitializer.prototype.buildGeth = function() {
  var theOptions = {
    cwd: this.paths.gethProjectBase,
    env: process.env
  };
  this.log(`Building geth, path: ${this.paths.gethProjectBase}`);
  this.runShell("make", [], theOptions, - 1,()=>{
    this.log(`Geth build exit.`);
  });
}

KanbanGoInitializer.prototype.runNodesFinish = function(response) {
  //if (this.numberOfStartedNodes < this.nodes.length) {
  //  return;
  //}
  var result = {};
  result.result = `Spawned ${this.nodes.length} nodes.`;
  var nodeNotes = [];
  for (var counterNodes = 0; counterNodes < this.nodes.length; counterNodes ++) {
    if (this.nodes[counterNodes].notes !== "") {
      nodeNotes[counterNodes] = this.nodes[counterNodes].notes;
    }
  }
  if (nodeNotes.length > 0) {
    result.nodeNotes = nodeNotes;
  }
  if (this.notes !== "") {
    result.notes = this.notes;
  }
  response.writeHead(200);
  response.end(JSON.stringify(result));
}

KanbanGoInitializer.prototype.runNodes = function(response, queryCommand) {
  var candidateNumberOfNodes = Number(queryCommand.numberOfNodes);
  var maxNumberOfNodes = 100;
  if (candidateNumberOfNodes > maxNumberOfNodes || candidateNumberOfNodes < 1) {
    response.writeHead(400);
    response.end(`Bad number of nodes: ${candidateNumberOfNodes}. I expected a number between 1 and ${maxNumberOfNodes}.`);
    return;
  }
  if (this.nodes.length > 0) {
    this.numberRequestsRunning --;
    response.writeHead(200);
    response.end(`${this.nodes.length} nodes already spawned. Restart the server if you want a new number of nodes. `);
    return;
  }
  for (var counterNode = 0; counterNode < candidateNumberOfNodes; counterNode ++) {
    this.nodes.push(new NodeKanbanGo(counterNode));
  }
  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    this.nodes[counterNode].initializeFoldersAndKeys(response);
  }
}

KanbanGoInitializer.prototype.runNodes2ReadConfig = function(response) {
  if (this.numberOfInitializedFolders < this.nodes.length) {
    return;
  }
  this.allAddresses = {};
  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    var currentNode = this.nodes[counterNode];
    if (!currentNode.flagFoldersInitialized) {
      var result = {};
      result.error = `Failed to initilize folders for node: ${counterNode}`;
      result.notes = currentNode.notes;
      response.writeHead(200);
      response.end(JSON.stringify(result));
      return;
    }
    this.allAddresses[currentNode.ethereumAddress] = true;
  }
  fs.readFile(this.paths.pbftConfig, this.runNodes3ParseConfigRunNodes.bind(this, response));
}

KanbanGoInitializer.prototype.runNodes3ParseConfigRunNodes = function(response, error, data) {
  if (error !== null && error !== undefined) {
    this.log(`Error reading config file: ${this.paths.pbftConfig}. ${error}`);
    this.runNodes4RebuildPBFTConfiguration(response);
    return;
  }
  this.log(`Successfully opened pbft.json`);
  this.numberOfAttemptsToLoadPBFTConfiguration ++;
  if (this.numberOfAttemptsToLoadPBFTConfiguration > 4) {
    this.log(`Too many failed attempts to load pbft.json. `);
    return;
  }
  if (this.numberOfAttemptsToLoadPBFTConfiguration > 1) {
    this.log(`${this.numberOfAttemptsToLoadPBFTConfiguration} attempts to load pbft.json so far. `);
  }
  try {
    this.pbftConfiguration = JSON.parse(data);
    if (this.pbftConfiguration.config.pbft.proposers.length !== this.nodes.length) {
      this.log(`File pbft.json indicates ${this.pbftConfiguration.config.pbft.proposers.length} proposers but you asked me to spin ${this.nodes.length}. Rebuilding pbft.json... `);
      this.runNodes4RebuildPBFTConfiguration(response);
      return;
    }
    if (this.pbftConfiguration.config.chainId !== this.chainId) {
      this.log(`File pbft.json indicates chain id: ${this.pbftConfiguration.config.chainId}, but the requested chain id is: ${this.chainId}. Rebuilding pbft.json... `);
      this.runNodes4RebuildPBFTConfiguration(response);
      return;
    }
    for (var counterProposers = 0; counterProposers < this.pbftConfiguration.config.pbft.proposers.length; counterProposers ++) {
      var currentAddress = this.pbftConfiguration.config.pbft.proposers[counterProposers];
      if (!(currentAddress in this.allAddresses)) {
        this.log(`Proposer ${currentAddress} from pbft.json not found among the nodes stored on disk. Rebuilding pbft.json... `);
        this.runNodes4RebuildPBFTConfiguration(response);
        return;
      }
    }
  } catch (e) {
    this.log(`Error reading pbft configuration. ${e}`);
    this.runNodes4RebuildPBFTConfiguration(response);
    return;
  }
  this.numberOfInitializedGenesis = this.nodes.length - 1;
  this.runNodes6DoRunNodes(response);
}

KanbanGoInitializer.prototype.runNodes6DoRunNodes = function(response) {
  this.numberOfInitializedGenesis ++;
  if (this.numberOfInitializedGenesis < this.nodes.length) {
    return;
  }
  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    this.nodes[counterNode].run(response);
  }
}

KanbanGoInitializer.prototype.runNodes4RebuildPBFTConfiguration = function(response) {
  if (this.pbftConfigurationSeed === null || this.pbftConfigurationSeed === undefined) {
    throw `This is not supposed to happen: seed pbft configuration is null.`;
  }
  this.pbftConfiguration = Object.assign({}, this.pbftConfigurationSeed);
  this.pbftConfiguration.config.chainId = this.chainId;
  this.pbftConfiguration.config.pbft.proposers = [];
  this.pbftConfiguration.config.pbft.proposerPublicKeys = [];
  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    var currentNode = this.nodes[counterNode];
    this.pbftConfiguration.config.pbft.proposers.push(`0x${currentNode.nodeAddressHex}`);
    this.pbftConfiguration.config.pbft.proposerPublicKeys.push(`${currentNode.nodePublicKeyHex}`);
    //Pre - funded accounts: correspond to node secret. 
    //this.pbftConfiguration.alloc[currentNode.ethereumAddress] = { 
    //  balance: "0x20000000000000000000"
    //};
    this.pbftConfiguration.alloc[currentNode.nodeAddressHex] = { 
      balance: "0x20000000000000000000"
    };
  }
  fs.writeFile(this.paths.pbftConfig, JSON.stringify(this.pbftConfiguration, null, 2), (err) =>{
    if (err !== null && err !== undefined) {
      this.log(`Error writing pbft.json. ${err}`);
      this.runNodes2ReadConfig(response);
    }
    this.runNodes5InitGenesis(response);
  });
}

KanbanGoInitializer.prototype.runNodes5InitGenesis = function(response) {
  for (counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    this.nodes[counterNode].computeMyEnodeAddress();
  }
  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    this.nodes[counterNode].initialize9GenesisBlock(response);
  }
  this.runNodes7WriteNodeConfig();
}


KanbanGoInitializer.prototype.runNodes7WriteNodeConfig = function() {
  var nodeConfig = [];
  for (var i = 0; i < this.nodes.length; i ++) {
    nodeConfig.push(this.nodes[i].getNodeConfig());
  }
  console.log(`Proceeding to write node config to: ${this.paths.nodesDir}`);
  fs.writeFile(this.paths.nodeConfiguration, JSON.stringify(nodeConfig, null, 2),()=>{});
}

KanbanGoInitializer.prototype.runShell = function(command, theArguments, theOptions, id, callbackOnExit) {
  console.log(`About to execute: ${command}`.yellow);
  console.log(`Arguments: ${theArguments}`.green);
  var child = childProcess.spawn(command, theArguments, theOptions);
  var shellId = "";
  if (id >= 0) {
    var color = this.colors[id % this.colors.length];
    shellId = `[shell ${id}] `[color];
  } else {
    shellId = `[KanbanGoInitializer] `.red;
  }
  child.stdout.on('data', function(data) {
    console.log(shellId + data.toString());
  });
  child.stderr.on('data', function(data) {
    console.log(shellId + data.toString());
  });
  child.on('error', function(data) {
    console.log(shellId + data.toString());
  });
  child.on('exit', function(code) {
    console.log(`Geth ${id} exited with code: ${code}`.green);
    if (callbackOnExit !== undefined && callbackOnExit !== null) {
      callbackOnExit();
    }
  });
}

KanbanGoInitializer.prototype.handleRPCArguments = function(request, response, queryCommand) {
  //console.log(`DEBUG: this.paths: ${this.paths}.`);
  this.numberRequestsRunning ++;
  if (this.numberRequestsRunning > this.maxRequestsRunning) {
    response.writeHead(500);
    this.numberRequestsRunning --;
    return response.end(`Too many (${this.numberRequestsRunning}) requests running, maximum allowed: ${this.maxRequestsRunning}. `);
  }
  var theCallLabel = queryCommand[pathnames.rpcCall];
  if (!(theCallLabel in kanbanGOInitialization.rpcCalls)) {
    response.writeHead(400);
    this.numberRequestsRunning --;
    return response.end(`KanbanGO initialization call label ${theCallLabel} not found. `);    
  }
  if (!(theCallLabel in this.handlers)) {
    response.writeHead(200);
    return response.end(`{"error": "No handler named ${theCallLabel}"} found. `);
  }
  var currentHandler = this.handlers[theCallLabel];
  var currentFunction = currentHandler.handler;
  if (currentFunction === undefined || currentFunction === null) {
    currentFunction = this[theCallLabel];
  }
  if (currentFunction === undefined || currentFunction === null || (typeof currentFunction !== "function")) {
    response.writeHead(500);
    return response.end(`{"error": "Server error: handler ${theCallLabel}"} declared but no implementation found. `);
  }
  try {
    return (currentFunction.bind(this))(response, queryCommand);
  } catch (e) {
    response.writeHead(500);
    return response.end(`Server error: ${e}`);
  }
}

module.exports = {
  KanbanGoInitializer,
  getInitializer
}