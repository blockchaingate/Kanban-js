"use strict";
const pathnames = require('./pathnames');
const colors = require('colors');

function Jobs() {
  this.ongoing = {};
  this.recentlyFinished = {};
  this.jobHandler = null;
  this.totalJobs = 0;
  this.maxRecentlyFinishedJobsToRetain = 10;
  this.numRecentlyFinishedJobsToRetainOnPrune = 3;
}

Jobs.prototype.getNumberOfJobs = function() {
  return Object.keys(this.ongoing).length;
}

Jobs.prototype.getOngoingIds = function() {
  return Object.keys(this.ongoing);
}

Jobs.prototype.setStatus = function(id, message) {
  if (!(id in this.ongoing)){
    console.log(`Error: bad job id: ${id}`.red);
    return;
  }
  console.log(`job id ${id} status: ${message}`);
  this.ongoing[id].status = message;
}

Jobs.prototype.finishJob = function (id, message) {
  console.log(`Finishing job ${id}`);
  this.recentlyFinished[id] = {
    message: message
  };
  if (id in this.ongoing) {
    delete this.ongoing[id];
  }
  if (Object.keys(this.recentlyFinished).length > this.maxRecentlyFinishedJobsToRetain) {
    var keysOrdered = Object.keys(this.recentlyFinished).sort();
    var totalToDelete = this.maxRecentlyFinishedJobsToRetain - this.numRecentlyFinishedJobsToRetainOnPrune;
    for (var counterKeys = 0 ; counterKeys < totalToDelete; counterKeys ++) {
      delete this.recentlyFinished[keysOrdered[counterKeys]];
    }
    console.log(`After pruning, remaining jobs: ${JSON.stringify(this.recentlyFinished)}`);
  }
}

Jobs.prototype.addJob = function (jobHandler, jobFunctionLabel) {
  var timeInMilliseconds = (new Date()).getTime();
  this.totalJobs ++;
  var callId = `currentCommandLabel_${this.totalJobs}_${this.getNumberOfJobs()}_${timeInMilliseconds}`;
  this.ongoing[callId] = {
    status: pathnames.computationalEngineCallStatuses.starting,
    name: jobFunctionLabel
  };
  process.nextTick(function() {
    console.log(`handling callid: ${callId}`);
    jobHandler(callId);
  });
  return callId;
}

module.exports = {
  Jobs
}
