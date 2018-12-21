const childProcess = require("child_process");
const fs = require('fs');

function Monitor() {
  this.currentDate = new Date();
  this.logFolder = `${__dirname}/../logfiles/${this.currentDate.toISOString()}`;
  console.log(`DEBUG: current folder: ${__dirname}`);
  console.log(`DEBUG: this.logFolder: ${this.logFolder}`)
  this.currentLogFileName = "";
  this.numberOfBytesWrittenToCurrentLogfile = 0;
  this.makeNewLogFileWhenNumberOfBytesExceeds = 10000000;
  this.numberOfLogFiles = 0;
}

Monitor.prototype.run = function(){
  if (!fs.existsSync(this.logFolder)) {
    fs.mkdirSync(this.logFolder, 0744);
  }  
  this.getNewLogFileName();
  var startScript = [`${__dirname}/app.js`];
  console.log(`About to execute node ${startScript}`);
  var child = childProcess.spawn(`node`, startScript);
  var thisObject = this; //<- this object pointer to be used in child handler (this pointer is out-of-closure).
  child.stdout.on('data', function(data) {
    thisObject.writeDataToLog(data);
    console.log(data.toString());
  });
  
  child.on('error', function(data) {
    thisObject.writeDataToLog(data);
    console.log(data.toString());
  });
  
  child.on('exit', function(code) {
    var data = `app.js exited with code: ${code}`;
    console.log(data.toString());
    fs.appendFileSync(thisObject.currentLogFileName, data);  
    process.exit(0);
  });
}



Monitor.prototype.getNewLogFileName = function() {
  this.numberOfLogFiles ++;
  this.currentLogFileName = `${this.logFolder}/log${this.numberOfLogFiles}_${this.currentDate.toISOString()}.log`;
}

Monitor.prototype.writeDataToLog = function(data) {
  fs.appendFileSync(this.currentLogFileName, data);
  this.numberOfBytesWrittenToCurrentLogfile += data.length;
  if (this.numberOfBytesWrittenToCurrentLogfile > this.makeNewLogFileWhenNumberOfBytesExceeds) {
    this.getNewLogFileName();
    this.numberOfBytesWrittenToCurrentLogfile = 0;
  }  
}

var monitor = new Monitor();
monitor.run();