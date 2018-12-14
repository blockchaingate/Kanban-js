"use strict"
const memWatch = require('memwatch-next');

function MemoryWatcher () {
  this.leakSuspicions = new Array(10);
  this.currentSuspicionIndex = - 1;
  this.latestStats = null;
}

MemoryWatcher.prototype.recordLeakSuspicion = function (info) {
  this.currentSuspicionIndex ++;
  if (this.currentSuspicionIndex > this.leakSuspicions.length) {
    this.currentSuspicionIndex = 0;
  }
  this.leakSuspicions[this.currentSuspicionIndex] = info;
}
MemoryWatcher.prototype.recordStats = function (stats) {
  this.latestStats = stats;
}

var memoryWatcher = new MemoryWatcher();
memWatch.on('leak', memoryWatcher.recordLeakSuspicion.bind(memoryWatcher));
memWatch.on('stats', memoryWatcher.recordStats.bind(memoryWatcher));

module.exports = {
  memoryWatcher
}