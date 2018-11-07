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

function ResponseWrapperWithLimits(response) {
  this.response = response;
  getInitializer().numberRequestsRunning ++;
}

ResponseWrapperWithLimits.prototype.end = function(input) {
  this.response.end(input);
  getInitializer().numberRequestsRunning --;
}

ResponseWrapperWithLimits.prototype.writeHead = function(input) {
  this.response.writeHead(input);
}

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

NodeKanbanGo.prototype.initializeDeleteLockFile = function(response, callback) {
  console.log(`DEBUG: got to init folders and keys`);
  fs.unlink(this.lockFileName, callback);
}

NodeKanbanGo.prototype.initialize2ReadKeyStore = function(response, error) {
  var initializer = getInitializer();
  if (!initializer.flagGetGenesisFromFoundationChain) {
    fs.readdir(this.keyStoreFolder, this.initialize3SelectAddress.bind(this, response));
  } else {
    this.initialize4point5ReadNodeKey(response);
  }
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
  console.log(`DEBUIG: got to initialize3selectaddress`);
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
  this.initialize4point5ReadNodeKey(response);
}

NodeKanbanGo.prototype.initialize4point5ReadNodeKey = function(response) {
  this.flagFoldersInitialized = true;
  fs.readFile(this.nodeKeyFileName, (err, data)=>{
    if (err !== null && err !== undefined) {
      this.logToInitializationStream(`Error reading node key: ${this.nodeKeyFileName}. ${err}`);
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
  if (getInitializer().flagGetGenesisFromFoundationChain) {
    theArguments.push(
      "--bridge.chainnet",
      "reg",
      "--bridge.attachtorunning",
      "--bridge.rpcuser",
      global.fabcoinNode.configuration.RPCUser,
      "--bridge.rpcpassword",
      global.fabcoinNode.configuration.RPCPassword,
      "--bridge.scar.address",
      initializer.smartContractId,
      "--bridge.scar.abi",
      initializer.abiJSON,
      "--deposit",
      0
    );
  }

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
  this.flagGetGenesisFromFoundationChain = false;
  this.flagStartWasEverAttempted = false;
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
  this.smartContractId = "";
  this.abiJSON = "";
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

KanbanGoInitializer.prototype.handleQuery = function(responseNoWrapper, query) {
  var responseWithWrap = new ResponseWrapperWithLimits(responseNoWrapper);
  var queryCommand = null;
  var queryNode = null;
  try {
    queryCommand = JSON.parse(query.command);
    var nodeJSON = query[kanbanGORPC.urlStrings.node];
    if (nodeJSON !== null && nodeJSON !== undefined) {
      queryNode = JSON.parse(nodeJSON);
    }
  } catch (e) {
    responseWithWrap.writeHead(400);
    return response.end(`Bad kanbanGO initialization input: ${JSON.stringify(query)}. ${e}`);
  }
  return this.handleRPCArguments(responseWithWrap, queryCommand, queryNode);
}

KanbanGoInitializer.prototype.computePaths = function() {
  /** @type {string} */
  var startingPath = global.kanban.configuration.kanbanGO.gethFolder;
  if (!startingPath.endsWith("/")){
    startingPath += "/";
  }
  if (startingPath === undefined || startingPath === null) {
    startingPath = "/";
  }
  startingPath = path.normalize(startingPath);
  var currentPath = startingPath;
  var maxNumRuns = 100;
  var numRuns = 0;
  /** @type {string} */
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
  this.contractParents = {};
  this.fileNamesBinaryWithPath = [];
  this.fileNamesABIWithPath = [];
  this.flagTokenized = false;
  this.flagContractNamesComputed = false;
  /**@type {ResponseWrapperWithLimits} */
  this.responseToUser = null;
  this.responseContent = {
    ABI: null,
    binaries: null,
    contractNames: null,
    contractInheritance: null,
  };
  this.numberOfFilesRead = 0;
  this.totalFilesToRead = 0;
  this.owner = null;
  /**@type {OutputStream} */
  this.errorStream = new OutputStream();
  this.errorStream.idConsole = "[Solidity]";
  this.errorStream.colorIdConsole = "red";
}

SolidityCode.prototype.getSourceFileNameWithPath = function () {
  return `${this.pathBase}/${this.getSourceFileName()}`;
}

SolidityCode.prototype.extractTokens = function() {
  if (this.flagTokenized) {
    return;
  }
  //console.log("DEbug: this.code: " + this.code);
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
  this.contractParents = {};
  for (var i = 2; i < this.tokens.length; i ++) {
    if (this.tokens[i - 2] === "\n" && this.tokens[i - 1] === "contract") {
      var currentName = this.tokens[i];
      this.contractNames.push(currentName);
      if (this.contractParents[currentName] === undefined) {
        this.contractParents[currentName] = {};
      }
      if (i + 2 < this.tokens.length) {
        if (this.tokens[i + 1] === "is") {
          this.contractParents[currentName][this.tokens[i + 2]] = true;
        }
      }
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
  this.responseContent.binaries[counter] = dataBinary.toString();
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
  if (this.errorStream.recentOutputs.length > 0) {
    this.responseToUser.writeHead(200);
    var result = {};
    result.error = `Failed to compile your solidity file. `;
    result.errorStream = this.errorStream.toString(); 
    this.responseToUser.end(JSON.stringify(result));
    return;
  }
  //console.log("DEBUG: exectuing readAndReturnBinaries");
  this.computeContractNames();
  this.responseContent.ABI = [];
  this.responseContent.binaries = [];
  this.responseContent.contractNames = this.contractNames;
  this.responseContent.contractInheritance = this.contractParents;
  this.numberOfFilesRead = 0;
  this.totalFilesToRead = this.contractNames.length * 2;
  for (var i = 0; i < this.fileNamesBinaryWithPath.length; i ++) {
    //console.log(`DEBUG:reading ${this.fileNamesBinaryWithPath[i]}, ${this.fileNamesABIWithPath[i]}`);
    fs.readFile(this.fileNamesBinaryWithPath[i], this.readBinary.bind(this, i));
    fs.readFile(this.fileNamesABIWithPath[i], this.readABI.bind(this, i));
  }
}

SolidityCode.prototype.removeLineFromTokens = function(startIndex) {
  var found = false;
  var comment = "\n//";
  for (var j = startIndex; j < this.tokens.length; j ++) {
    if (this.tokens[j] === "\n") {
      if (found) {
        this.tokens[startIndex] = comment;
        return;
      } 
      found = true;
      continue;
    }
    comment += this.tokens[j];
    this.tokens[j] = "";
  }
}

SolidityCode.prototype.codeInherits = function(/**@type {SolidityCode} */ other) {
  for (var myContract in this.contractParents) {
    for (var myParent in this.contractParents[myContract]) {
      if (myParent in other.contractParents) {
        return true;
      }
    }
  }
  return false;
} 

SolidityCode.prototype.buildSolFileKanbanGoFromCombinedFile = function(inputCode) {
  this.code = inputCode;
  this.extractTokens();
  var pragmaFound = false;
  for (var i = 2; i < this.tokens.length; i ++) {
    if (this.tokens[i - 2] === "\n" && this.tokens[i - 1] === "pragma") {
      if (!pragmaFound) {
        pragmaFound = true;
        continue;
      }
      this.removeLineFromTokens(i - 2);
    }
    if (this.tokens[i - 1] === "\n" && this.tokens[i] === "import") {
      this.removeLineFromTokens(i - 1);
    }
  }
  var tokensWithWhiteSpace = new Array(this.tokens.length);
  for (var i = 1; i < this.tokens.length; i ++) {
    if (this.tokens[i] !== "\n" && this.tokens[i] !== "") {
      tokensWithWhiteSpace[i] = this.tokens[i] + " ";
    } else {
      tokensWithWhiteSpace[i] = this.tokens[i];
    }
  }
  this.code = tokensWithWhiteSpace.join("");
  return this.code;
}

KanbanGoInitializer.prototype.compileSolidityPart2 = function(
  /**@type {ResponseWrapperWithLimits} */
  response,
  /**@type {SolidityCode} */
  solidityCode,
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
  this.runShell(
    `${pathnames.path.base}/node_modules/solc/solcjs`, 
    theArguments, 
    theOptions, 
    - 1, 
    solidityCode.readAndReturnBinaries.bind(solidityCode),
    solidityCode.errorStream
  );
}

function SolidityBuilder (){
  this.fileNames = [];
  this.fileContents = [];
  /**@type {Array.<SolidityCode>} */
  this.contentParsers = [];
  this.contentSortedIndices = [];

  this.fileContentsSorted = [];
  this.pathBase = "";
  this.response = null;
  this.owner = null;
  this.result = {
  };
  this.numberOfFilesRead = 0;
}

SolidityBuilder.prototype.compareContentIndices = function (leftIndex, rightIndex) {
  var leftContract = this.contentParsers[leftIndex];
  var rightContract = this.contentParsers[rightIndex];
  var leftComesEarlier =  rightContract.codeInherits(leftContract);
  var rightComesEarlier = leftContract.codeInherits(rightContract);
  var uncomparable = (leftComesEarlier && rightComesEarlier) || (!leftComesEarlier && !rightComesEarlier);
  //console.log(`DEBUG: comparing contract: ${leftContract.contractNames[0]} with ${rightContract.contractNames[0]}`);
  if (uncomparable) {
    if (leftIndex < rightIndex) {
      return - 1;
    }
    if (leftIndex > rightIndex) {
      return 1;
    }
    return 0;
  }
  if (leftComesEarlier) {
    return - 1;
  }
  if (rightComesEarlier) {
    return 1;
  }
  throw "While comparing code, reached a line of code that should be unreachable";
}

SolidityBuilder.prototype.sortCode = function () {
  this.contentParsers = new Array(this.fileContents.length);
  this.contentSortedIndices = new Array(this.fileContents.length);
  for (var i = 0; i < this.contentParsers.length; i ++) {
    this.contentParsers[i] = new SolidityCode("", "");
    this.contentParsers[i].code = this.fileContents[i].toString();
    this.contentParsers[i].extractTokens();
    this.contentParsers[i].computeContractNames();
    this.contentSortedIndices[i] = i;
  }
  //Using bubble sort because contracts are only partially ordered by inheritance
  for (var i = 0; i < this.contentSortedIndices.length; i ++) {
    for ( var j = i + 1; j < this.contentSortedIndices.length; j ++) {
      if (this.compareContentIndices(this.contentSortedIndices[i], this.contentSortedIndices[j]) > 0) {
        var temp = this.contentSortedIndices[i];
        this.contentSortedIndices[i] = this.contentSortedIndices[j];
        this.contentSortedIndices[j] = temp;
      }
    }
  }
  for (var i = 0; i < this.contentSortedIndices.length; i ++) {
    this.fileContentsSorted[i] = this.fileContents[this.contentSortedIndices[i]];
  }
}

SolidityBuilder.prototype.respond = function () {
  if (this.response === null) {
    return;
  }
  this.sortCode();
  this.response.writeHead (200);
  var solidityMassage = new SolidityCode("", "");
  var joinedCode = this.fileContentsSorted.join("");
  this.result.code = solidityMassage.buildSolFileKanbanGoFromCombinedFile(joinedCode);
  this.response.end(JSON.stringify(this.result));
  this.response = null;
}

SolidityBuilder.prototype.combineFiles = function () {
  fs.readdir(this.pathBase, this.callbackReadDirectory.bind(this));
}

SolidityBuilder.prototype.callbackReadDirectory = function (error, fileNames) {
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

SolidityBuilder.prototype.callbackReadFile = function(counter, error, content) {
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
  var fileCombinator = new SolidityBuilder();
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
    response.end(`Failed to extract code from ${queryCommand.code}. ${e}`);
    return;
  }
}

KanbanGoInitializer.prototype.killAllGeth = function(
  response, 
  queryCommand,
  /**@type {NodeKanbanGo} */ 
  currentNode
) {
  for (var i = 0; i < this.nodes.length; i ++) {
    this.log(`Running child process kill command for node ${i}. ` );
    this.nodes[i].childProcessHandle.kill();
    this.nodes[i].initializeDeleteLockFile(response, ()=>{});
  }
  this.runShell("killall", ["geth"]);
  this.nodes = [];
  this.getNodeInformation(response, queryCommand)
}

KanbanGoInitializer.prototype.getLogFile = function(
  response, 
  queryCommand,
  /**@type {NodeKanbanGo} */ 
  currentNode
) {
  if (currentNode === null || currentNode === undefined || !(currentNode instanceof NodeKanbanGo)) {
    response.writeHead(400);
    var result = {
      error: `Bad node id. Current node: ${currentNode} `
    };
    response.end(JSON.stringify(result));
  }
  response.writeHead(200);
  var result = currentNode.outputStreams.log.toArray();
  response.end(JSON.stringify(result));
}

KanbanGoInitializer.prototype.getRPCLogFile = function(
  response, 
  queryCommand,
  /**@type {NodeKanbanGo} */ 
  currentNode
) {
  if (currentNode === null || currentNode === undefined || !(currentNode instanceof NodeKanbanGo)) {
    response.writeHead(400);
    var result = {
      error: `Bad node id. Current node: ${currentNode} `
    };
    response.end(JSON.stringify(result));
  }
  response.writeHead(200);
  var result = currentNode.outputStreams.rpcCalls.toArray();
  response.end(JSON.stringify(result));
}

KanbanGoInitializer.prototype.runNodesDetached = function(response, queryCommand, currentNodeNotUsed) {
  this.flagGetGenesisFromFoundationChain = false;
  this.paths.nodesDir = `${this.paths.dataDir}/nodes_detached`;
  this.runNodes(response, queryCommand);
}

KanbanGoInitializer.prototype.runNodesOnFAB = function(response, queryCommand, currentNodeNotUsed) {
  this.flagGetGenesisFromFoundationChain = true;
  this.paths.nodesDir = `${this.paths.dataDir}/nodes_fab`;
  console.log(`DBUG: this is queryCommand: ${JSON.stringify(queryCommand)}`);
  this.smartContractId = queryCommand.contractId;
  this.abiJSON = queryCommand.abiJSON;
  this.runNodes(response, queryCommand);
}

KanbanGoInitializer.prototype.runNodes = function(response, queryCommand) {
  this.flagStartWasEverAttempted = true;
  console.log(`DEBUIG: got to here pt 1`);
  var candidateNumberOfNodes = Number(queryCommand.numberOfNodes);
  var maxNumberOfNodes = 100;
  if (
    candidateNumberOfNodes > maxNumberOfNodes || 
    candidateNumberOfNodes < 1 || 
    typeof candidateNumberOfNodes !== "number" ||
    Number.isNaN(candidateNumberOfNodes)
  ) {
    response.writeHead(400);
    response.end(`Bad number of nodes: ${candidateNumberOfNodes}. I expected a number between 1 and ${maxNumberOfNodes}.`);
    return;
  }
  if (this.nodes.length > 0) {
    response.writeHead(200);
    response.end(`${this.nodes.length} nodes already spawned. Restart node.js if you want a new number of nodes. `);
    return;
  }
  for (var counterNode = 0; counterNode < candidateNumberOfNodes; counterNode ++) {
    this.nodes.push(new NodeKanbanGo(counterNode));
  }
  console.log(`DEBUG: got to before loop, candidates: ${candidateNumberOfNodes}`);
  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    var currentNode = this.nodes[counterNode]; 
    currentNode.initializeDeleteLockFile(response, currentNode.initialize2ReadKeyStore.bind(currentNode, response));
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
    if (!this.flagGetGenesisFromFoundationChain) {
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
    } else {
      this.runNodes5InitGenesis(response);
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
  if (this.numberOfInitializedGenesis < this.nodes.length && !this.flagGetGenesisFromFoundationChain) {
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
    if (this.flagGetGenesisFromFoundationChain) {
      this.nodes[counterNode].initialize10WriteNodeConnections(response);
    } else {
      this.nodes[counterNode].initialize9GenesisBlock(response);
    }
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

KanbanGoInitializer.prototype.runShell = function(
  command, 
  theArguments, 
  theOptions, 
  id, 
  callbackOnExit,
  /**@type {OutputStream} */
  errorLog
) {
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
    if (errorLog !== null && errorLog !== undefined) {
      errorLog.append(data.toString());
    } else if (currentNode !== null) {
      currentNode.logRegular(data.toString());
    } else {
      thisContainer.log(data.toString())
    }
  });
  child.on('error', function(data) {
    if (errorLog !== null && errorLog !== undefined) {
      errorLog.append(data.toString());
    } else if (currentNode !== null) {
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

KanbanGoInitializer.prototype.handleRPCArguments = function(
  /**@type {ResponseWrapperWithLimits} */  
  response, 
  queryCommand, 
  queryNode
) {
  //console.log(`DEBUG: this.paths: ${this.paths}.`);
  if (this.numberRequestsRunning > this.maxRequestsRunning) {
    response.writeHead(500);
    return response.end(`Too many (${this.numberRequestsRunning}) requests running, maximum allowed: ${this.maxRequestsRunning}. `);
  }
  var theCallLabel = queryCommand[kanbanGORPC.urlStrings.rpcCallLabel];
  if (!(theCallLabel in kanbanGOInitialization.rpcCalls)) {
    response.writeHead(400);
    return response.end(`KanbanGO initialization call label ${theCallLabel} not found. `);    
  }
  if (!(theCallLabel in this.handlers) && !(kanbanGOInitialization.rpcCalls)) {
    response.writeHead(200);
    return response.end(`{"error": "No KB handler named ${theCallLabel} found."} `);
  }
  var currentNode = null;
  try {
    if (queryNode !== null){
      var currentNodeId = queryNode.id;
      if (currentNodeId === undefined || currentNodeId === null) {
        response.writeHead(400);
        return response.end(`Node is missing the id variable. `);        
      }
      if (currentNodeId === "none" || currentNodeId === "all") {
        currentNode = null;
      } else {
        var currentNodeIdNumber = Number(currentNodeId);
        currentNode = this.nodes[currentNodeIdNumber];
        if (currentNode === undefined || currentNode === null) {
          response.writeHead(400);
          return response.end(`KanbanGoInitializer: failed to extract node id from ${currentNodeId}.`);          
        }
      }
    }
  } catch (e) {
    response.writeHead(200);
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
    return response.end(`{"error": "Server error: handler ${theCallLabel} declared but no implementation found."} `);
  }
  try {
    return (currentFunction.bind(this))(response, queryCommand, currentNode);
  } catch (e) {
    response.writeHead(500);
    return response.end(`Server error: ${e}`);
  }
}

module.exports = {
  NodeKanbanGo,
  KanbanGoInitializer,
  getInitializer
}