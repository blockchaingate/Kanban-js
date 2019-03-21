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
var ResponseWrapper = require('../../response_wrapper').ResponseWrapper;

/**
 * Returns the ambient kanbanGOInitializer.
 * @returns {KanbanGoInitializer}
 */
function getInitializer() {
  return global.kanban.kanbanGOInitializer;
}

function NodeKanbanGo(
  /**@type {{id: String, contractId: String, connectInALine: boolean, numberOfNodes: Number}} */
  inputData
) {
  var initializer = getInitializer();
  /**@type {Number} */
  this.id = inputData.id;
  /**@type {String} */
  this.contractId = inputData.contractId;
  /**@type {Boolean} */
  this.flagConnectInALine = inputData.connectInALine;
  /**@type {Number} */
  this.numberOfNodes = inputData.numberOfNodes;
  this.basePath = `${getInitializer().paths.nodesDir}/${this.numberOfNodes}_${initializer.chainId}`;
  if (this.flagConnectInALine) {
    this.basePath += "l";
  } else {
    this.basePath += "fg";
  }
  if (this.contractId.length > 30) {
    this.basePath += `_${this.contractId.slice(0, this.contractId.length - 30)}`;
  } else {
    this.basePath += `_${this.contractId}`;
  }
  this.fileNameNodeAddress = null;
  this.nodePrivateKey = new cryptoKanban.CurveExponent();
  /** @type {string} */
  this.nodePublicKeyHex = null;
  /** @type {string} */
  this.nodePublicKeyHexUncompressedNoPrefix = null;
  /** @type {string} */
  this.nodeAddressHex = null;
  /** @type {string[]} */
  this.nodeConnections = [];
  this.dataDir = `${this.basePath}/node${this.id}`;
  this.logFileDefault = `${this.dataDir}/log.txt`;
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
  /**@type {String[]} */
  this.argumentsGeth = [];
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
  this.outputStreams.log.fileName = this.logFileDefault;

  this.outputStreams.log.idConsole = `[Node ${this.id}] `;
  this.outputStreams.log.colorIdConsole = initializer.colors[this.id % initializer.colors.length];
  this.outputStreams.initialization.idConsole = `[Node ${this.id}] `;
  this.outputStreams.initialization.colorIdConsole = initializer.colors[this.id % initializer.colors.length];
  this.outputStreams.log.maximumLength = 3000;
  this.outputStreams.rpcCalls.idConsole = `[RPC node ${this.id}] `;
  this.outputStreams.rpcCalls.colorIdConsole = initializer.colors[this.id % initializer.colors.length];
  this.outputStreams.rpcCalls.maximumLength = 3000;
}

NodeKanbanGo.prototype.initializeDeleteLockFile = function(response, callback) {
  this.outputStreams.initialization.log(`Deleting lock file: ${this.lockFileName}`);
  fs.unlink(this.lockFileName, callback);
}

NodeKanbanGo.prototype.logToInitializationStream = function(input) {
  this.outputStreams.initialization.append(input);
}

NodeKanbanGo.prototype.logRegular = function(input) {
  this.outputStreams.log.append(input);
}

NodeKanbanGo.prototype.initialize4point5ReadNodeKey = function(response) {
  this.flagFoldersInitialized = true;
  fs.readFile(this.nodeKeyFileName, (err, data) => {
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
  rimraf(this.dataDir, this.initialize7GenerateKey.bind(this, response));
}

NodeKanbanGo.prototype.computeNodeInfo = function () {
  this.nodeInformation.id = this.id;
  this.nodeInformation.RPCPort = this.RPCPort;
  this.nodeInformation.port = this.port;
  this.nodeInformation.myEnodeAddress = this.myEnodeAddress;
  var initializer = getInitializer();
  this.nodeInformation.chainId = initializer.chainId;
  if (("" + initializer.chainId) === ("" + initializer.chainIdTestNet)) {
    this.nodeInformation.comment = "Chain id running on testnet, revealing sensitive information.";
    this.nodeInformation.argumentsGeth = this.argumentsGeth;
    this.nodeInformation.argumentsGethOneLine = this.argumentsGeth.join(" ");
  }
  
  this.nodeSensitiveInformation = Object.assign({}, this.nodeInformation);
  this.nodeSensitiveInformation.secretKey = this.nodePrivateKey.toHex();
  this.nodeSensitiveInformation.myConnections = this.nodeConnections;
}

NodeKanbanGo.prototype.initialize7GenerateKey = function(response, error) {
  this.logToInitializationStream(`Proceding to generate node key. `);
  this.nodePrivateKey.generateAtRandom();
  fsExtra.ensureDir(this.nodeKeyDir, this.initialize8WriteKey.bind(this, response));
}

NodeKanbanGo.prototype.initialize8WriteKey = function(response, errorDir) {
  if (errorDir !== null && errorDir !== undefined) {
    this.logToInitializationStream(`Failed to create directory: ${this.nodeKeyDir}. ${errorDir}`);
    this.initialize4point5ReadNodeKey(response, null);
    return;
  }
  fs.writeFile(this.nodeKeyFileName, this.nodePrivateKey.toHex(), (errorWrite) => {
    if (errorWrite !== null && errorWrite !== undefined) {
      this.logToInitializationStream(`Error writing node private key: ${errorWrite}.`);
    } else {
      this.logToInitializationStream(`Wrote node key file. `);
    }
    this.initialize4point5ReadNodeKey(response, null);
  });
}

NodeKanbanGo.prototype.computeMyEnodeAddress = function (){
  this.myEnodeAddress = `enode://${this.nodePublicKeyHexUncompressedNoPrefix}@[::]:${this.port}?discport=0`;
}

NodeKanbanGo.prototype.initialize10WriteNodeConnections = function(response) {
  var initializer = getInitializer();
  this.nodeConnections = [];
  var idsToConnectTo = [];
  if (this.flagConnectInALine) {
    idsToConnectTo = [this.id - 1, this.id + 1];
  } else {
    for (var i = 0; i < this.numberOfNodes; i ++) {
      if (i === this.id) {
        continue;
      }
      idsToConnectTo.push(i);
    }
  }
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
  this.argumentsGeth = [
    "--datadir",
    this.dataDir,
    "--nodiscover",
    "--mine",
    "--verbosity",
    4,
    "--rpc",
    "--rpcaddr",
    "0.0.0.0",
    "--rpcapi",
    "db,kanban,net,web3,personal,pbft,bridge,pbfttest,cryptotest,admin",
    "--kanbanstats",
    `${this.nodePublicKeyHex}:abcd@169.45.42.100:3000`,
    "--identity",
    `${this.nodePublicKeyHex}`,
    "--networkid",
    initializer.chainId,
    "--syncmode",
    "full",
    "--port",
    this.port.toString(),
    "--rpcport",
    this.RPCPort.toString()
  ];
  this.argumentsGeth.push(
    "--bridge.chainnet",
    initializer.bridgeChainnet,
    "--bridge.attachtorunning",
    "--bridge.rpcuser",
    global.fabcoinNode.configuration.RPCUser,
    "--bridge.rpcpassword",
    global.fabcoinNode.configuration.RPCPassword,
    "--bridge.scar.address",
    initializer.smartContractId,
    "--bridge.scar.abi",
    initializer.abiJSON,
    "--bridge.flagEnableTests",
    "--deposit",
    //0,
    1000
  );
  this.childProcessHandle = initializer.runShell(initializer.paths.geth, this.argumentsGeth, theOptions, this.id);
  initializer.numberOfStartedNodes ++;
  initializer.runNodesFinish(response);
}

/**
 * All-in one initilizer for geth nodes.
 * @class
 */
function KanbanGoInitializer() {
  this.numberOfKanbanGORuns = 0;
  this.numberOfRequestsRunning = 0;
  this.maxRequestsRunning = 4;
  this.flagStartWasEverAttempted = false;
  this.colors = ["yellow", "green", "blue", "cyan", "magenta"];
  this.paths = {
    geth: "",
    gethPath: "",
    gethProjectBase: "",
    dataDir: "",
    solidityDir: "",
    nodesDir: "",
    passwordEmptyFile: "",
    nodeConfiguration: "",
  };
  this.chainIdTestNet = 212;
  this.chainId = 211;
  /** @type {NodeKanbanGo[]} */
  this.nodes = [];
  /** @type {OutputStream} */
  this.notesStream = new OutputStream();
  this.notesStream.idConsole = "[KanbanGoInitializer] ";
  this.notesStream.colorIdConsole = "red";

  /** @type {String} */
  this.bridgeChainnet = "reg";

  this.numberOfInitializedFolders = 0;
  this.numberOfInitializedGenesis = 0;
  this.numberOfStartedNodes = 0;
  /**@type {object[]} */
  this.nodeInformation = [];
  this.smartContractId = "";
  this.abiJSON = "";
  /**@type {boolean} */
  this.flagConnectKanbansInALine = true;
}

KanbanGoInitializer.prototype.log = function(input) {
  this.notesStream.append(input);
}

KanbanGoInitializer.prototype.computePaths = function() {
  /** @type {String} */
  var startingPath = global.kanban.configuration.configuration.kanbanGO.gethFolder;
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
  /** @type {String} */
  var kanbanDataDirName = global.kanban.configuration.configuration.kanbanGO.dataDirName;
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
    throw(`Could not find geth executable. Please specify its location in the configure file: ` + `${pathnames.pathname.configurationSecretsAdmin}`.bold.green);
  } else {
    console.log(`Found geth executable:`.green + `${this.paths.geth}`.blue);
  }
  if (this.paths.dataDir === "") {
    console.log(`Could not find data directory ${kanbanDataDirName}. Searched directories along: ${startingPath}`.red);
    throw(`Could not find kanban data directory. Please specify its location in the configure file: ` + `${pathnames.pathname.configurationSecretsAdmin}`.bold.green);
  } else {
    console.log(`Found data directory: `.green + `${this.paths.dataDir}`.blue);
  }
  this.paths.gethProjectBase = path.normalize(`${this.paths.gethPath}/../../`);
  this.paths.nodeConfiguration = `${this.paths.dataDir}/node_config.json`;
  this.paths.passwordEmptyFile = `${this.paths.dataDir}/password_empty.txt`;
  this.paths.nodesDir = `${this.paths.dataDir}/nodes`;
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
  this.runShell("killall ", ["geth"], theOptions, - 1, ()=>{
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
    nodeNotes[counterNodes] = this.nodes[counterNodes].outputStreams.initialization.toArray();
  }
  if (nodeNotes.length > 0) {
    result.node = nodeNotes;
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
  this.code = Buffer.from(codeBase64, "base64").toString();
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
  /**@type {ResponseWrapper} */
  this.responseToUser = null;
  this.responseContent = {
    ABI: null,
    binaries: null,
    contractNames: null,
    contractInheritance: null,
    error: "",
  };
  this.numberOfFilesRead = 0;
  this.totalFilesToRead = 0;
  this.owner = null;
  /**@type {OutputStream} */
  this.errorStream = new OutputStream();
  this.errorStream.idConsole = "[Solidity] ";
  this.errorStream.colorIdConsole = "red";
  /**@type {OutputStream} */
  this.standardStream = new OutputStream();
  this.standardStream.idConsole = "[Solidity] ";
  this.standardStream.colorIdConsole = "blue";
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
      } else {
        this.tokens.push(" ");
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
  if (this.responseContent.error === null || this.responseContent.error === undefined || this.responseContent.error === "") {
    delete this.responseContent.error;
  }
  if (this.responseContent.error !== null && this.responseContent.error !== undefined && this.responseContent.error !== "") {
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
  //console.log("Got to read binary result");
  if (err) {
    this.responseContent.error += `Failed to read binary file ${this.fileNamesBinaryWithPath[counter]}. ${err}`;
    return this.sendResult();
  }

  if (this.standardStream.recentOutputs.length > 0) {
    this.responseContent.resultHTML = this.standardStream.recentOutputs.toString();
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
    this.responseContent.error += `Failed to read binary file. ${err}`; 
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
    this.responseContent.comments = `While compiling your file, there were errors printed on the error stream. Those should be fatal, but just in case, I continue.`;
    this.responseContent.error += this.errorStream.toString(); 
    //old version: 
    //this.responseToUser.writeHead(200);
    // var result = {};
    // result.error = `Failed to compile your solidity file. `;
    // result.errorStream = this.errorStream.toString(); 
    //this.responseToUser.end(JSON.stringify(result));
    //return;
  }
  this.computeContractNames();
  this.responseContent.ABI = [];
  this.responseContent.binaries = [];
  this.responseContent.contractNames = this.contractNames;
  this.responseContent.contractInheritance = this.contractParents;
  this.numberOfFilesRead = 0;
  this.totalFilesToRead = this.contractNames.length * 2;
  if (this.fileNamesBinaryWithPath.length === 0) {
    this.responseContent.error += "Got 0 binaries. ";
    this.sendResult();
    return;
  }
  for (var i = 0; i < this.fileNamesBinaryWithPath.length; i ++) {
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
  /**@type {ResponseWrapper} */
  response,
  /**@type {SolidityCode} */
  solidityCode,
) {
  var theArguments = [
    "--bin",
    "--abi",
    solidityCode.getSourceFileName(),
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
    solidityCode.errorStream,
    solidityCode.standardStream
  );
}

function SolidityBuilder () {
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
  this.response.writeHead(200);
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

KanbanGoInitializer.prototype.fetchKanbanContractTwo = function(  
  response, 
  queryCommand,
  notUsed,
) {
  var fileCombinator = new SolidityBuilder();
  fileCombinator.response = response;
  fileCombinator.pathBase = `${pathnames.path.base}/miscellaneous/feeAccepter`; 
  fileCombinator.owner = this;
  fileCombinator.combineFiles();
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

KanbanGoInitializer.prototype.fetchDemoContract = function(  
  response, 
  queryCommand,
  notUsed,
) {
  var fileCombinator = new SolidityBuilder();
  fileCombinator.response = response;
  fileCombinator.pathBase = `${pathnames.path.base}/miscellaneous/loyalpoints/`; 
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
      var result = {
        error: `Code too large: ${solidityCode.code.length}`
      };
      response.end(JSON.stringify(result));
      return;
    }
    fs.writeFile(
      solidityCode.getSourceFileNameWithPath(), 
      solidityCode.code, 
      this.compileSolidityPart2.bind(this, response, solidityCode),
    );
  } catch (e) {
    response.writeHead(200);
    var result = {
      error: `Failed to extract code from ${queryCommand.code}. ${e}`
    };
    response.end(JSON.stringify(result));
    return;
  }
}

KanbanGoInitializer.prototype.fetchLocalRegtestNodeConfig = function(
  /** @type {ResponseWrapper} */
  response, 
  queryCommand,
  /**@type {NodeKanbanGo} */ 
  currentNode
) {
  fs.readFile(this.paths.nodeConfiguration, (err, data)=>{
    var result = {};
    if (err !== null && err !== undefined) {
      result.error = JSON.stringify(err);
      response.writeHead(500);
      return response.end(JSON.stringify(result));
    }
    response.writeHead(200);
    response.end(data);
  });  
}

KanbanGoInitializer.prototype.killAllGeth = function(
  /** @type {ResponseWrapper} */
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
) {
  var serviceWrapper = {};
  if (! this.extractCurrentServiceFromKanbanLocal(response, queryCommand, serviceWrapper)) {
    return false;
  }
  var currentNode = serviceWrapper.service;
  var result = currentNode.outputStreams.log.toArray();
  response.writeHead(200);
  response.end(JSON.stringify(result));
}

KanbanGoInitializer.prototype.getRPCLogFile = function(
  response, 
  queryCommand,
  /**@type {NodeKanbanGo} */ 
  currentNode
) {
  var serviceWrapper = {};
  if (! this.extractCurrentServiceFromKanbanLocal(response, queryCommand, serviceWrapper)) {
    return false;
  }
  var currentNode = serviceWrapper.service;
  var result = currentNode.outputStreams.rpcCalls.toArray();
  response.writeHead(200);
  response.end(JSON.stringify(result));
}

KanbanGoInitializer.prototype.runNodesOnFAB = function(response, queryCommand, currentNodeNotUsed) {
  this.paths.nodesDir = `${this.paths.dataDir}/nodes_fab`;
  //console.log(`DBUG: this is queryCommand: ${JSON.stringify(queryCommand)}`);
  if (
    queryCommand.abiJSON === null || queryCommand.abiJSON === undefined || 
    queryCommand.abiJSON === "" || queryCommand.abiJSON === "undefined"
  ) {
    var result = {
      error: `Unrecognized ABI format: abiJSON: ${queryCommand.abiJSON}`
    };
    response.writeHead(400);
    return response.end(JSON.stringify(result));
  }
  if (typeof this.smartContractId !== "string") {
    var result = {
      error: `smartContractId expected to be a string, instead received: ${queryCommand.smartContractId}`
    };
    response.writeHead(400);
    return response.end(JSON.stringify(result));
  }
  this.bridgeChainnet = queryCommand.bridgeChainnet;
  var allowedNets = {
    reg: true, 
    regnet: true
  };
  if (!(this.bridgeChainnet in allowedNets)) {
    var result = {
      error: `Could not determine the bridgeChain net. Your input was: ${this.bridgeChainnet}.`,
      allowedBridgeChainnets: Object.keys(allowedNets),
    };
    response.writeHead(400);
    return response.end(JSON.stringify(result));
  }
  this.chainId = queryCommand.chainId;
  var allowedKanbanChainIds = {
    "211": true,
    "212": true,
  };
  if (!(this.chainId in allowedKanbanChainIds)) {
    var result = {
      error: `Could not determine the kanban chainId. Your input was: ${this.chainId}.`,
      allowedChainIds: Object.keys(allowedKanbanChainIds),
    };
    response.writeHead(400);
    return response.end(JSON.stringify(result));
  }
  this.smartContractId = queryCommand.contractId;
  this.abiJSON = queryCommand.abiJSON;
  this.flagConnectKanbansInALine = queryCommand.connectKanbansInALine;
  this.runNodes(response, queryCommand);
}

KanbanGoInitializer.prototype.runNodes = function(
  /**@type {ResponseWrapper} */
  response, queryCommand
) {
  this.flagStartWasEverAttempted = true;
  this.numberOfKanbanGORuns ++;
  this.log(`${this.numberOfKanbanGORuns} attempts to initialize KanbanGO so far. `);
  var candidateNumberOfNodes = Number(queryCommand.numberOfNodes);
  var maxNumberOfNodes = 100;
  if (
    candidateNumberOfNodes > maxNumberOfNodes || 
    candidateNumberOfNodes < 1 || 
    typeof candidateNumberOfNodes !== "number" ||
    Number.isNaN(candidateNumberOfNodes)
  ) {
    response.writeHead(400);
    var result = {
      error: `Bad number of nodes: ${candidateNumberOfNodes}. I expected a number between 1 and ${maxNumberOfNodes}. `
    };
    response.end(JSON.stringify(result));
    return;
  }
  if (this.nodes.length > 0) {
    response.writeHead(200);
    var result = {
      error: `${this.nodes.length} nodes already spawned. Restart node.js if you want a new number of nodes. `
    };
    response.end(JSON.stringify(result));
    return;
  }
  for (var counterNode = 0; counterNode < candidateNumberOfNodes; counterNode ++) {
    var currentNode = new NodeKanbanGo({
      id: counterNode,
      contractId: this.smartContractId,
      connectInALine: this.flagConnectKanbansInALine,
      numberOfNodes: candidateNumberOfNodes
    });
    this.nodes.push(currentNode);
    if (currentNode.nodeKeyFileName.length > 100) {
      var errorString = `Computed node key file name: ${currentNode.nodeKeyFileName} too long (${currentNode.nodeKeyFileName.length} characters). `;
      errorString += `This breaks the kanbanGO ipc endpoint, which has a size limit of 100 chars due to unix file socket limitations. `;
      errorString += `Please move your kanban installation in a folder of smaller length, or write us an angry email to fix this. `;
      var result = {
        error: errorString        
      };
      response.writeHead(500);
      return response.end(JSON.stringify(result));
    }

  }
  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    var currentNode = this.nodes[counterNode]; 
    currentNode.initializeDeleteLockFile(response, currentNode.initialize4point5ReadNodeKey.bind(currentNode, response));
  }
}

KanbanGoInitializer.prototype.runNodes2ReadConfig = function(response) {
  if (this.numberOfInitializedFolders < this.nodes.length) {
    return;
  }
  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    var currentNode = this.nodes[counterNode];
    if (!currentNode.flagFoldersInitialized) {
      var result = {};
      result.error = `Failed to initilize folders for node: ${counterNode}`;
      result.notes = currentNode.outputStreams.initialization.toArray();
      response.writeHead(200);
      response.end(JSON.stringify(result));
      return;
    }
  }
  this.runNodes5InitGenesis(response);
}

KanbanGoInitializer.prototype.runNodes5InitGenesis = function(response) {
  for (counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    this.nodes[counterNode].computeMyEnodeAddress();
  }
  for (var counterNode = 0; counterNode < this.nodes.length; counterNode ++) {
    this.nodes[counterNode].initialize10WriteNodeConnections(response);
  }  
  this.runNodes7WriteNodeConfig();
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

KanbanGoInitializer.prototype.runNodes7WriteNodeConfig = function() {
  var nodeConfig = [];
  for (var i = 0; i < this.nodes.length; i ++) {
    this.nodes[i].computeNodeInfo();
    nodeConfig.push(this.nodes[i].nodeSensitiveInformation);
  }
  this.log(`Proceeding to write node config to: ${this.paths.nodeConfiguration}`);
  fs.writeFile(this.paths.nodeConfiguration, JSON.stringify(nodeConfig, null, 2),()=>{});
}

KanbanGoInitializer.prototype.runShell = function(
  command, 
  theArguments, 
  theOptions, 
  id, 
  callbackOnExit,
  /**@type {OutputStream} */
  errorLog,
  /**@type {OutputStream} */
  standardLog,
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
    var dataToLog = data.toString().trim();
    if (dataToLog === "") {
      return;
    }
    if (standardLog !== null && standardLog !== undefined) {
      standardLog.append(dataToLog);
    } else if (currentNode !== null) {
      currentNode.logRegular(dataToLog);
    } else {
      thisContainer.log(dataToLog);
    }
  });
  child.stderr.on('data', function(data) {
    if (errorLog !== null && errorLog !== undefined) {
      errorLog.append(data.toString());
    } else if (currentNode !== null) {
      currentNode.logRegular(data.toString());
    } else {
      thisContainer.log(data.toString());
    }
  });
  child.on('error', function(data) {
    if (errorLog !== null && errorLog !== undefined) {
      errorLog.append(data.toString());
    } else if (currentNode !== null) {
      currentNode.logRegular(data.toString());
    } else {
      thisContainer.log(data.toString());
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

/** @returns {Boolean} */
KanbanGoInitializer.prototype.extractCurrentServiceFromKanbanLocal = function(
  /**@type {ResponseWrapper} */  
  response, 
  queryCommand,
  output,
) {
  try {
    var serviceObject = queryCommand[kanbanGORPC.urlStrings.serviceLabelReserved];
    var currentNodeId = serviceObject[kanbanGORPC.urlStrings.nodeId];
    if (currentNodeId === undefined || currentNodeId === null) {
      response.writeHead(400);
      var result = {
        error: `Node is missing the ${kanbanGORPC.urlStrings.serviceLabelReserved}.${kanbanGORPC.urlStrings.nodeId} variable. `,
      };
      response.end(JSON.stringify(result));
      return false;
    }
    if (currentNodeId === "none" || currentNodeId === "all") {
      if (this.nodes.length > 0) {
        output.service = this.nodes[0];
        return true;
      }
      response.writeHead(400);
      var result = {
        error: `Failed to select node ${currentNodeId}: ${this.nodeInformation.length} nodes running. `,
      };
      response.end(JSON.stringify(result));
      return false;
    }
    var currentNodeIdNumber = Number(currentNodeId);
    output.service = this.nodes[currentNodeIdNumber];
    if (output.service === undefined || output.service === null) {
      response.writeHead(400);
      var result = {
        error: `KanbanGoInitializer: failed to extract node id from ${currentNodeId}. `,
      };
      response.end(JSON.stringify(result));          
      return false;
    }
    return true;
  } catch (e) {
    response.writeHead(200);
    var result = {
      error: `Failed to process node info. ${e} `
    };
    response.end(JSON.stringify(result));
    return false;
  }
}

KanbanGoInitializer.prototype.extractCurrentService = function(  
  /**@type {ResponseWrapper} */  
  response, 
  queryNode,
  output,
) {
  output.service = null;
  if (queryNode === null) {
    return true;
  } 
  if (typeof queryNode !== "object") {
    response.writeHead(400);
    var result = {
      error: `queryNode object expected to be of type object, got ${typeof queryNode} instead.`
    };
    response.end(JSON.stringify(result));
    return false;
  }
  if (queryNode.type === "kanbanLocal") {
    return this.extractCurrentServiceFromKanbanLocal(response, queryNode, output);
  }
  return true;
}

KanbanGoInitializer.prototype.handleRPCArguments = function(
  /**@type {ResponseWrapper} */  
  response, 
  queryCommand,
) {
  //console.log(`DEBUG: this.paths: ${this.paths}.`);
  if (this.numberRequestsRunning > this.maxRequestsRunning) {
    response.writeHead(500);
    var result = {
      error: `Too many (${this.numberRequestsRunning}) requests running, maximum allowed: ${this.maxRequestsRunning}. `,
    };
    return response.end(JSON.stringify(result));
  }
  var theCallLabel = queryCommand[kanbanGORPC.urlStrings.rpcCallLabel];
  if (theCallLabel === null || theCallLabel === undefined) {
    response.writeHead(400);
    var result = {
      error: `The ${kanbanGORPC.urlStrings.rpcCallLabel} entry appears to be missing from your command: ${JSON.stringify(queryCommand)} `
    };
    return response.end(JSON.stringify(result));    
  }  
  var callsToSearch = [kanbanGOInitialization.rpcCalls, kanbanGOInitialization.demoRPCCalls];
  var rpcCalls = null;
  for (var i = 0; i < callsToSearch.length; i ++) {
    if (theCallLabel in callsToSearch[i]) {
      rpcCalls = callsToSearch[i];
      break;
    }
  }
  if (rpcCalls === null) {
    response.writeHead(400);
    var result = {
      error: `KanbanGO initialization call label ${theCallLabel} not found. `
    };
    return response.end(JSON.stringify(result));    
  }
  var serviceWrapper = {};
  if (!this.extractCurrentService(response, queryCommand, serviceWrapper)) {
    return;
  }
  var currentService = serviceWrapper.service;
  var currentFunction = null;
  var objectsToSearchForImplementation = [this, global.nodeManager];
  var implementationThisObject = null;
  for (var i = 0; i < objectsToSearchForImplementation.length; i ++) {
    currentFunction = objectsToSearchForImplementation[i][theCallLabel];
    if (typeof currentFunction === "function") {
      implementationThisObject = objectsToSearchForImplementation[i];
      break;
    }
  }
  if (typeof currentFunction !== "function") {
    response.writeHead(500);
    var result = {
      error: `Server error: handler ${theCallLabel} declared but no implementation found. `,
    };
    return response.end(JSON.stringify(result));
  }
  try {
    return (currentFunction.bind(implementationThisObject))(response, queryCommand, currentService);
  } catch (e) {
    response.writeHead(500);
    var result = {
      error: `Server error: ${e}`,
    };
    return response.end(JSON.stringify(result));
  }
}

module.exports = {
  NodeKanbanGo,
  KanbanGoInitializer,
  getInitializer
}
