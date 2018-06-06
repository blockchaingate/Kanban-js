"use strict";
const ids = require('./ids_dom_elements');

function mainPage() {
  return window.kanban.thePage;
}

function progressSpan() { 
  return document.getElementById(ids.defaults.progressReport);
}

module.exports = {
  mainPage,
  progressSpan
}