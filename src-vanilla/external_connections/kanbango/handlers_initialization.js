"use strict";

const kanbanGOInitialization = require('./initialization');
const kanbanGORPC = require('./rpc');
const pathnames = require('../../pathnames');
const childProcess = require("child_process");
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const rimraf = require('rimraf');
const cryptoKanban = require('../../crypto/crypto_kanban');
const encodingsKanban = require('../../crypto/encodings');
var OutputStream = require('../../output_stream').OutputStream;
require('colors');
const handlersStandard = require('../../handlers_standard');

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
  this.nodePublicKeyHexUncompressedNoPrefix = null;
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
  /** @type {object} */
  this.nodeInformation = {};
  /** @type {object} */
  this.nodeSensitiveInformation = {};
  /** @type {ChildProcess} */
  this.childProcessHandle = null;
  /**@type {{log: OutputStream, initialization: OutputStream, rpcCalls: OutputStream}} */
  this.outputStreams = {
    initialization: new OutputStream(),
    log: new OutputStream(),
    rpcCalls: new OutputStream(),
  };
  var initializer = getInitializer();
  this.outputStreams.log.idConsole = `[Node ${this.id}]`;
  this.outputStreams.log.colorIdConsole = initializer.colors[this.id % initializer.colors.length];
  this.outputStreams.initialization.idConsole = `[Node ${this.id}]`;
  this.outputStreams.initialization.colorIdConsole = initializer.colors[this.id % initializer.colors.length];
  this.outputStreams.log.maximumLength = 3000;
  this.outputStreams.rpcCalls.idConsole = `[RPC node ${this.id}]`;
  this.outputStreams.rpcCalls.colorIdConsole = initializer.colors[this.id % initializer.colors.length];
  this.outputStreams.rpcCalls.maximumLength = 3000;
}

NodeKanbanGo.prototype.initializeFoldersAndKeys = function(response) {
  fs.unlink(this.lockFileName, this.initialize2ReadKeyStore.bind(this, response));
}

NodeKanbanGo.prototype.initialize2ReadKeyStore = function(response, error) {
  fs.readdir(this.keyStoreFolder, this.initialize3SelectAddress.bind(this, response));
}

NodeKanbanGo.prototype.logToInitializationStream = function(input) {
  this.notes += `${input}<br>\n`;
  this.outputStreams.initialization.append(input);
}

NodeKanbanGo.prototype.logRegular = function(input) {
  this.notes += `${input}<br>\n`;
  this.outputStreams.log.append(input);
}

NodeKanbanGo.prototype.initialize3SelectAddress = function(response, error, fileNames) {
  if (error !== null && error !== undefined) {
    this.logToInitializationStream(`Error reading key store directory: ${this.keyStoreFolder}. ${error}`);
    this.flagFoldersWereInitialized = false;
  } else {
    this.logToInitializationStream(`Successfully read key store directory: ${this.keyStoreFolder}`);
  }
  this.numberAttemptsToSelectAddress ++;
  if (this.numberAttemptsToSelectAddress > this.maximumAttemptsToSelectAddress) {
    this.logToInitializationStream(`${this.numberAttemptsToSelectAddress} failed attempts to select address: aborting.`);
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
    this.logToInitializationStream(`Found no previously generated keys. Resetting all folders and keys. `);
    this.flagFoldersWereInitialized = false;
    this.initialize5ResetFolders(response);
    return;
  }
  this.fileNameNodeAddress = `${this.keyStoreFolder}/${fileNames[0]}`;
  fs.readFile(this.fileNameNodeAddress, this.initialize4ReadAccountAddress.bind(this, response));
}

NodeKanbanGo.prototype.initialize4ReadAccountAddress = function(response, error, data) {
  if (error !== null && error !== undefined) {
    this.logToInitializationStream(`Error reading stored key: ${this.fileNameNodeAddress}. ${error}`);
    this.flagFoldersWereInitialized = false;
    this.initialize5ResetFolders(response);
    return;
  }
  try {
    this.ethereumAddressFileContent = data;
    this.ethereumAddressFileParsed = JSON.parse(this.ethereumAddressFileContent);
    this.ethereumAddress = this.ethereumAddressFileParsed.address;
    this.logToInitializationStream(`Successfully read ethereum address: ${this.ethereumAddress}`);
  } catch (e) {
    this.logToInitializationStream(`Error while parsing key file. ${error}. The key file content: ${data}`);
    this.initialize5ResetFolders(response);
    return;
  }
  this.flagFoldersInitialized = true;
  fs.readFile(this.nodeKeyFileName, (err, data)=>{
    if (err !== null && err !== undefined) {
      this.logToInitializationStream(`Error reading node key: ${this.nodeKeyFileName}. ${error}`);
      this.flagFoldersWereInitialized = false;
      this.initialize5ResetFolders(response);
      return;
    }
    this.nodePrivateKey.fromArbitrary(data);
    this.nodePublicKeyHex = this.nodePrivateKey.getExponent().toHex();
    this.nodePublicKeyHexUncompressedNoPrefix = this.nodePrivateKey.getExponent().toHexUncompressed().slice(2);
    this.nodeAddressHex = this.nodePrivateKey.getExponent().computeEthereumAddressHex();
    this.logToInitializationStream(`Loaded private key from node key file: ${this.nodePrivateKey.toHex()} with corresponding ethereum address: ${this.nodeAddressHex}`);
    getInitializer().numberOfInitializedFolders ++;
    getInitializer().runNodes2ReadConfig(response);
  });
}

NodeKanbanGo.prototype.initialize5ResetFolders = function(response) {
  rimraf(this.dataDir, this.initialize6CreateFolders.bind(this, response));
}

NodeKanbanGo.prototype.initialize6CreateFolders = function(response, error) {
  if (error !== null && error !== undefined) {
    this.logToInitializationStream(`Error while deleting folder: ${this.dataDir}. ${error}`);
  } else {
    this.logToInitializationStream(`Deleted folder: ${this.dataDir}.`);
  }
  this.logToInitializationStream(`Proceding to create account for new node.`);
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

NodeKanbanGo.prototype.computeNodeInfo = function () {
  this.nodeInformation = {};
  this.nodeInformation.id = this.id;
  this.nodeInformation.RPCPort = this.RPCPort;
  this.nodeInformation.port = this.port;
  this.nodeInformation.myEnodeAddress = this.myEnodeAddress;
  
  this.nodeSensitiveInformation = Object.assign({}, this.nodeInformation);
  this.nodeSensitiveInformation.secretKey = this.nodePrivateKey.toHex();
  this.nodeSensitiveInformation.myConnections = this.nodeConnections;
}

NodeKanbanGo.prototype.initialize7GenerateKey = function(response, error) {
  this.logToInitializationStream(`Generated acount in key store. Proceding to generate node key. `);
  this.nodePrivateKey.generateAtRandom();
  fsExtra.ensureDir(this.nodeKeyDir, this.initialize8WriteKey.bind(this, response));
}

NodeKanbanGo.prototype.initialize8WriteKey = function(response, errorDir) {
  if (errorDir !== null && errorDir !== undefined) {
    this.logToInitializationStream(`Failed to create directory: ${this.nodeKeyDir}. ${errorDir}`);
    this.initialize2ReadKeyStore(response, null);
    return;
  }
  fs.writeFile(this.nodeKeyFileName, this.nodePrivateKey.toHex(), (errorWrite)=> {
    if (errorWrite !== null && errorWrite !== undefined) {
      this.logToInitializationStream(`Error writing node private key: ${errorWrite}.`);
    } else {
      this.logToInitializationStream(`Wrote node key file. `);
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
  this.logToInitializationStream(`Proceding to initialize genesis. `);
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
  this.myEnodeAddress = `enode://${this.nodePublicKeyHexUncompressedNoPrefix}@[::]:${this.port}?discport=0`;
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
  this.logToInitializationStream(`Writing connections: ${JSON.stringify(this.nodeConnections)} to file: ${this.connectionsFileName}`);
  fs.writeFile(this.connectionsFileName, JSON.stringify(this.nodeConnections), (errorConnections)=> {
    //console.log(`DEBUG: did finally write connections`);
    if (errorConnections !== null && errorConnections !== undefined) {
      this.logToInitializationStream(`Error writing node connections. ${e}`);
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
    "--rpc",
    "--rpcapi",
    "db,kanban,net,web3,personal,pbft",
    "--kanbanstats",
    `${this.ethereumAddress}:abcd@localhost:3000`,
    "--networkid",
    initializer.chainId,
    "--syncmode",
    "full",
    "--port",
    this.port.toString(),
    "--rpcport",
    this.RPCPort.toString()
  ];
  this.childProcessHandle = initializer.runShell(initializer.paths.geth, theArguments, theOptions, this.id);
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
  };
  this.colors = ["yellow", "green", "blue", "cyan", "magenta"];
  this.paths = {
    geth: "",
    gethPath: "",
    gethProjectBase: "",
    dataDir: "",
    solidityDir: "",
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
  /**@type {object[]} */
  this.nodeInformation = [];
}

KanbanGoInitializer.prototype.log = function(input) {
  this.notes += `${input}<br>\n`;
  console.log(`[KanbanGoInitializer] `.red + `${input}`);
}

KanbanGoInitializer.prototype.handleRequest =  function(request, response) {
  handlersStandard.getQueryStringFromRequest(
    request, 
    response,
    this.handleQuery.bind(this)
  );
}

KanbanGoInitializer.prototype.handleQuery = function(response, query) {
  var queryCommand = null;
  var queryNode = null;
  try {
    queryCommand = JSON.parse(query.command);
    var nodeJSON = query[kanbanGORPC.urlStrings.node];
    if (nodeJSON !== null && nodeJSON !== undefined) {
      queryNode = JSON.parse(nodeJSON);
    }
  } catch (e) {
    response.writeHead(400);
    return response.end(`Bad kanbanGO initialization input: ${JSON.stringify(query)}. ${e}`);
  }
  return this.handleRPCArguments(response, queryCommand, queryNode);
}

KanbanGoInitializer.prototype.computePaths = function() {
  /** @type {string} */
  var startingPath = global.kanban.configuration.kanbanGO.gethFolder;
  if (startingPath === undefined || startingPath === null) {
    startingPath = "/";
  }
  startingPath = path.normalize(startingPath);
  var currentPath = startingPath;
  var maxNumRuns = 100;
  var numRuns = 0;
  var kanbanDataDirName = global.kanban.configuration.kanbanGO.dataDirName;
  //console.log(`DEBUG: searching for geth executable. Searched directories along: ${startingPath}`.red);
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
    if (this.paths.geth !== "" && this.paths.dataDir !== "") {
      break;
    }
    currentPath = path.normalize(currentPath + "../");
  }
  var currentDataDir = `${pathnames.path.base}/${kanbanDataDirName}`;
  if (fs.existsSync(currentDataDir)) {
    this.paths.dataDir = currentDataDir;
    this.paths.solidityDir = `${currentDataDir}/solidity`;
  }
  if (this.paths.geth === "") {
    console.log(`Could not find geth executable. Searched directories along: ${startingPath}`.red);
    throw(`Could not find geth executable.`);
  } else {
    console.log(`Found geth executable:`.green + `${this.paths.geth}`.blue);
  }
  if (this.paths.dataDir === "") {
    console.log(`Could not find data directory ${kanbanDataDirName}. Searched directories along: ${startingPath}`.red);
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

KanbanGoInitializer.prototype.killGeth = function() {
  var theOptions = {
    cwd: pathnames.path.base,
    env: process.env
  };
  this.log(`Killing geth ... `);
  this.runShell("killall ", ["geth"], theOptions, - 1,()=>{
    this.log(`Geth kill command exit.`);
  });
}

KanbanGoInitializer.prototype.killGethBuildGeth = function() {
  this.killGeth();
  this.buildGeth();
}

KanbanGoInitializer.prototype.killChildProcesses = function() {
  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    var currentNode = this.nodes[counterNode];
    console.log(`[KanbanGoInitializer] `.red + `Sending kill signal to child ${counterNode}.`)
    if (currentNode.childProcessHandle !== null) {
      currentNode.childProcessHandle.kill();
    }
  }
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
    result.node = nodeNotes;
  }
  if (this.notes !== "") {
    result.notes = this.notes;
  }
  response.writeHead(200);
  response.end(JSON.stringify(result));
  process.on("beforeExit", this.killChildProcesses.bind(this));
  process.on("SIGNINT", this.killChildProcesses.bind(this));
  process.on("SIGTERM", this.killChildProcesses.bind(this));
}

KanbanGoInitializer.prototype.computeNodeInfo = function() {
  this.nodeInformation = [];
  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    this.nodes[counterNode].computeNodeInfo();
    this.nodeInformation.push(this.nodes[counterNode].nodeInformation);
  }
}

KanbanGoInitializer.prototype.getNodeInformation = function(response, queryCommand) {
  this.computeNodeInfo();
  response.writeHead(200);
  response.end(JSON.stringify(this.nodeInformation));
  this.numberRequestsRunning --;
}

var numberOfSolidityCalls = 0;

function SolidityCode (codeBase64, basePath) {
  this.code = Buffer.from(codeBase64, "base64").toString();;
  this.fileNameBase = `solidityFile${numberOfSolidityCalls}`;
  this.pathBase = basePath;
  /** @type {string[]} */
  this.lines = null;
  /** @type {string[]} */
  this.tokens = null;
  /** @type {string[]} */
  this.contractNames = [];
  this.fileNamesBinaryWithPath = [];
  this.fileNamesABIWithPath = [];
  this.flagTokenized = false;
  this.flagContractNamesComputed = false;
  this.responseToUser = null;
  this.responseContent = {
    ABI: null,
    binaries: null,
    contractNames: null,
  };
  this.numberOfFilesRead = 0;
  this.totalFilesToRead = 0;
  this.owner = null;
}

SolidityCode.prototype.getSourceFileNameWithPath = function () {
  return `${this.pathBase}/${this.getSourceFileName()}`;
}

SolidityCode.prototype.extractTokens = function() {
  if (this.flagTokenized) {
    return;
  }
  this.lines = this.code.split("\n");
  this.tokens = ["\n"];
  for (var i = 0; i < this.lines.length; i ++) {
    var currentLine = this.lines[i].split(" ");
    for (var j = 0; j < currentLine.length; j ++) {
      var currentCandidate = currentLine[j].trim(); 
      if (currentCandidate !== "") {
        this.tokens.push(currentCandidate);
      }
    }
    this.tokens.push("\n");
  }
  this.flagTokenized = true;
}

SolidityCode.prototype.computeContractNames = function () {
  if (this.flagContractNamesComputed) {
    return;
  }
  this.extractTokens();
  this.contractNames = [];
  for (var i = 2; i < this.tokens.length; i ++) {
    if (this.tokens[i - 2] === "\n" && this.tokens[i - 1] === "contract") {
      this.contractNames.push( this.tokens[i]);
    }
  }
  this.flagContractNamesComputed = true;
  this.computeFileNames();
}

SolidityCode.prototype.computeFileNames = function () {
  var sourceStart = this.getSourceFileNameWithPath();
  this.fileNamesABIWithPath = [];
  this.fileNamesBinaryWithPath = [];
  for (var i = 0; i < this.contractNames.length; i ++) {
    this.fileNamesABIWithPath.push(`${sourceStart}_${this.contractNames[i]}.abi`);
    this.fileNamesBinaryWithPath.push(`${sourceStart}_${this.contractNames[i]}.bin`);
  }
}

SolidityCode.prototype.getSourceFileName = function() {
  return this.fileNameBase;
}

SolidityCode.prototype.sendResultIfNeeded = function() {
  //console.log(`DEBUG: number of files read: ${this.numberOfFilesRead}`);
  if (this.numberOfFilesRead >= this.totalFilesToRead) {
    this.sendResult();
  }
}

SolidityCode.prototype.sendResult = function() {
  if (this.responseToUser === null) {
    return;
  }
  if (this.responseContent.error !== null && this.responseContent.error !== undefined){
    this.responseToUser.writeHead(400);
  } else {
    this.responseToUser.writeHead(200);
  }
  this.responseToUser.end(JSON.stringify(this.responseContent));
  this.owner.numberRequestsRunning --;
  this.responseToUser = null;
}

SolidityCode.prototype.readBinary = function(counter, err, dataBinary) {
  if (this.responseToUser === null) {
    return;
  }
  if (err) {
    this.responseContent.error = `Failed to read binary file ${this.fileNamesBinaryWithPath[counter]}. ${err}`;
    return this.sendResult();
  }
  this.responseContent.binaries[counter] = encodingsKanban.encodingDefault.toHex(dataBinary);
  this.numberOfFilesRead ++;  
  this.sendResultIfNeeded();
}

SolidityCode.prototype.readABI = function(counter, err, dataABI) {
  if (this.responseToUser === null) {
    return;
  }
  if (err) {
    this.responseContent.error = `Failed to read binary file. ${err}`; 
    return this.sendResult();
  }  
  try {
    this.responseContent.ABI[counter] = JSON.parse(dataABI);
  } catch (e) {
    this.responseToUser.error = `Failed to parse ABI file ${this.fileNamesABIWithPath[counter]}. ${e}`;
    return this.sendResult();
  }
  this.numberOfFilesRead ++;  
  this.sendResultIfNeeded();
}

SolidityCode.prototype.readAndReturnBinaries = function() {
  //console.log("DEBUG: exectuing readAndReturnBinaries");
  this.computeContractNames();
  this.responseContent.ABI = [];
  this.responseContent.binaries = [];
  this.responseContent.contractNames = this.contractNames;
  this.numberOfFilesRead = 0;
  this.totalFilesToRead = this.contractNames.length * 2;
  for (var i = 0; i < this.fileNamesBinaryWithPath.length; i ++) {
    //console.log(`DEBUG:reading ${this.fileNamesBinaryWithPath[i]}, ${this.fileNamesABIWithPath[i]}`);
    fs.readFile(this.fileNamesBinaryWithPath[i], this.readBinary.bind(this, i));
    fs.readFile(this.fileNamesABIWithPath[i], this.readABI.bind(this, i));
  }
}

KanbanGoInitializer.prototype.compileSolidityPart2 = function(
  response,
  /**@type {SolidityCode} */
  solidityCode
) {
  var theArguments = [
    "--bin",
    "--abi",
    solidityCode.getSourceFileName()
  ];
  var theOptions = {
    cwd: this.paths.solidityDir,
    env: process.env,
  };
  solidityCode.responseToUser = response;
  solidityCode.owner = this;
  this.runShell("solcjs", theArguments, theOptions, - 1, solidityCode.readAndReturnBinaries.bind(solidityCode));
}

function FileCombinator (){
  this.fileNames = [];
  this.fileContents = [];
  this.pathBase = "";
  this.response = null;
  this.owner = null;
  this.result = {
  };
  this.numberOfFilesRead = 0;
}

FileCombinator.prototype.respond = function () {
  if (this.response === null) {
    return;
  }
  this.response.writeHead (200);
  this.result.code = this.fileContents.join("");
  this.response.end(JSON.stringify(this.result));
  this.owner.numberRequestsRunning --;
  this.response = null;
}

FileCombinator.prototype.combineFiles = function () {
  fs.readdir(this.pathBase, this.callbackReadDirectory.bind(this));
}

FileCombinator.prototype.callbackReadDirectory = function (error, fileNames) {
  if (error !== null && error !== undefined) {
    this.result.error = error;
    return this.respond();
  }
  this.fileNames = fileNames;
  this.result.fileNames = this.fileNames;
  this.fileContents = new Array(this.fileNames.length);
  this.numberOfFilesRead = 0;
  for (var i = 0; i < this.fileNames.length; i ++) {
    fs.readFile(`${this.pathBase}/${this.fileNames[i]}`, this.callbackReadFile.bind(this, i));
  }
}

FileCombinator.prototype.callbackReadFile = function(counter, error, content) {
  if (error !== null && error !== undefined) {
    this.result.error = error;
    return this.respond();
  }
  this.fileContents[counter] = content;
  this.numberOfFilesRead ++;
  if (this.numberOfFilesRead >= this.fileNames.length) {
    this.respond();
  }
}

KanbanGoInitializer.prototype.fetchKanbanContract = function(  
  response, 
  queryCommand,
  notUsed,
) {
  var fileCombinator = new FileCombinator();
  fileCombinator.response = response;
  fileCombinator.pathBase = `${this.paths.gethProjectBase}/contracts/scar/contract`; 
  fileCombinator.owner = this;
  fileCombinator.combineFiles();  
}

KanbanGoInitializer.prototype.compileSolidity = function(
  response, 
  queryCommand,
  notUsed,
) {
  numberOfSolidityCalls ++;
  try {
    var solidityCode = new SolidityCode(queryCommand.code, this.paths.solidityDir);
    if (solidityCode.code.length > 100000) {
      response.writeHead(200);
      this.numberRequestsRunning --;
      response.end(`Code too large: ${solidityCode.code.length}`);
      return;
    }
    fs.writeFile(
      solidityCode.getSourceFileNameWithPath(), 
      solidityCode.code, 
      this.compileSolidityPart2.bind(this, response, solidityCode),
    );
  } catch (e) {
    response.writeHead(200);
    this.numberRequestsRunning --;
    response.end(`Failed to extract code from ${queryCommand.code}. ${e}`);
    return;
  }
}

KanbanGoInitializer.prototype.getLogFile = function(
  response, 
  queryCommand,
  /**@type {NodeKanbanGo} */ 
  currentNode
) {
  this.numberRequestsRunning --;
  if (currentNode === null || currentNode === undefined || !(currentNode instanceof NodeKanbanGo)) {
    response.writeHead(400);
    response.end(`Bad node id. Current node: ${currentNode} `);
  }
  response.writeHead(200);
  var result = currentNode.outputStreams.log.toString();
  response.end(result);
}

KanbanGoInitializer.prototype.getRPCLogFile = function(
  response, 
  queryCommand,
  /**@type {NodeKanbanGo} */ 
  currentNode
) {
  this.numberRequestsRunning --;
  if (currentNode === null || currentNode === undefined || !(currentNode instanceof NodeKanbanGo)) {
    response.writeHead(400);
    response.end(`Bad node id. Current node: ${currentNode} `);
  }
  response.writeHead(200);
  var result = currentNode.outputStreams.rpcCalls.toString();
  response.end(result);
}

KanbanGoInitializer.prototype.runNodes = function(response, queryCommand, currentNodeNotUsed) {
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
    this.nodes[i].computeNodeInfo()
    nodeConfig.push(this.nodes[i].nodeSensitiveInformation);
  }
  console.log(`Proceeding to write node config to: ${this.paths.nodesDir}`);
  fs.writeFile(this.paths.nodeConfiguration, JSON.stringify(nodeConfig, null, 2),()=>{});
}

KanbanGoInitializer.prototype.runShell = function(command, theArguments, theOptions, id, callbackOnExit) {
  console.log(`About to execute: ${command}`.yellow);
  console.log(`Arguments: ${theArguments}`.green);
  var child = childProcess.spawn(command, theArguments, theOptions);
  var currentNode = null;
  if (id >= 0) {
    currentNode = this.nodes[id];
  }
  if (currentNode === undefined) {
    currentNode = null;
  }
  var thisContainer = this;
  child.stdout.on('data', function(data) {
    if (currentNode !== null) {
      currentNode.logRegular(data.toString());
    } else {
      thisContainer.log(data.toString())
    }
  });
  child.stderr.on('data', function(data) {
    if (currentNode !== null) {
      currentNode.logRegular(data.toString());
    } else {
      thisContainer.log(data.toString())
    }
  });
  child.on('error', function(data) {
    if (currentNode !== null) {
      currentNode.logRegular(data.toString());
    } else {
      thisContainer.log(data.toString())
    }
  });
  child.on('exit', function(code) {
    if (currentNode !== null) {
      currentNode.logRegular(`Geth ${id} exited with code: ${code}`);
      console.log(`Geth ${id} exited with code: ${code}`.green);
    } else {
      thisContainer.log(`Run shell exit with code: ${code}`.green);
    }
    if (callbackOnExit !== undefined && callbackOnExit !== null) {
      callbackOnExit();
    }
  });
  return child;
}

KanbanGoInitializer.prototype.handleRPCArguments = function(response, queryCommand, queryNode) {
  //console.log(`DEBUG: this.paths: ${this.paths}.`);
  this.numberRequestsRunning ++;
  if (this.numberRequestsRunning > this.maxRequestsRunning) {
    response.writeHead(500);
    this.numberRequestsRunning --;
    return response.end(`Too many (${this.numberRequestsRunning}) requests running, maximum allowed: ${this.maxRequestsRunning}. `);
  }
  var theCallLabel = queryCommand[kanbanGORPC.urlStrings.rpcCallLabel];
  if (!(theCallLabel in kanbanGOInitialization.rpcCalls)) {
    response.writeHead(400);
    this.numberRequestsRunning --;
    return response.end(`KanbanGO initialization call label ${theCallLabel} not found. `);    
  }
  if (!(theCallLabel in this.handlers) && !(kanbanGOInitialization.rpcCalls)) {
    response.writeHead(200);
    this.numberRequestsRunning --;
    return response.end(`{"error": "No KB handler named ${theCallLabel} found."} `);
  }
  var currentNode = null;
  try {
    if (queryNode !== null){
      var currentNodeId = queryNode.id;
      if (currentNodeId === undefined || currentNodeId === null) {
        response.writeHead(400);
        this.numberRequestsRunning --;
        return response.end(`Node is missing the id variable. `);        
      }
      if (currentNodeId === "none" || currentNodeId === "all") {
        currentNode = null;
      } else {
        var currentNodeIdNumber = Number(currentNodeId);
        currentNode = this.nodes[currentNodeIdNumber];
        if (currentNode === undefined || currentNode === null) {
          response.writeHead(400);
          this.numberRequestsRunning --;
          return response.end(`Failed to extract node id from ${currentNodeId}.`);          
        }
      }
    }
  } catch (e) {
    response.writeHead(200);
    this.numberRequestsRunning --;
    return response.end(`{"error": "Failed to process node info. ${e}"} `);
  }

  var currentFunction = null;
  if (theCallLabel in this.handlers) { 
    var currentHandler = this.handlers[theCallLabel];
    currentFunction = currentHandler.handler;
  }
  if (currentFunction === undefined || currentFunction === null) {
    currentFunction = this[theCallLabel];
  }
  if (currentFunction === undefined || currentFunction === null || (typeof currentFunction !== "function")) {
    response.writeHead(500);
    this.numberRequestsRunning --;
    return response.end(`{"error": "Server error: handler ${theCallLabel} declared but no implementation found."} `);
  }
  try {
    return (currentFunction.bind(this))(response, queryCommand, currentNode);
  } catch (e) {
    response.writeHead(500);
    this.numberRequestsRunning --;
    return response.end(`Server error: ${e}`);
  }
}

module.exports = {
  NodeKanbanGo,
  KanbanGoInitializer,
  getInitializer
}