"use strict";
const ids = require('./ids_dom_elements');
const miscellaneousFrontEnd = require('./miscellaneous_frontend');

function MyNode(
  /**@type {{id: String, ipAddress: String, user: String, sshKey: String}} */
  inputData,
) {
  this.id = inputData.id;
  this.idDOM = `radioButtonMyNode${this.id}`;
  this.ipAddress = inputData.ipAddress;
  this.user = inputData.user;
  this.sshKey = inputData.sshKey;
}

/** @returns {String} */
MyNode.prototype.toHtmlRadio = function() {
  var radioHTML = ""
  radioHTML += `<label class = "containerRadioButton">`;
  radioHTML += `<input type = "radio" name = "${ids.defaults.radioGroups.myNodesList}" id = "${this.idDOM}" `;
  radioHTML += ` onchange = "window.kanban.myNodes.selectRadio('${this.id}')" `; 
  if (this.flagSelected) {
    radioHTML += "checked";
  }
  radioHTML += `>`;
  radioHTML += `<span class = "radioMark"></span>`;
  radioHTML += `${this.id}`;
  radioHTML += `</label>`;
  return radioHTML;
}

function MyNodesContainer() {
  /**@type {Object.<string,MyNode>} */
  this.myNodes = {};
  this.myNodesRaw = null;
}

MyNodesContainer.prototype.selectAll = function() {
  miscellaneousFrontEnd.updateValue(ids.defaults.myNodes.inputSSH.machineNames, Object.keys(this.myNodes).join(", "))
}

MyNodesContainer.prototype.selectRadio = function(id) {
  miscellaneousFrontEnd.updateValue(ids.defaults.myNodes.inputSSH.machineNames, id)
}

MyNodesContainer.prototype.initialize = function(input) {
  var panel = document.getElementById(ids.defaults.myNodes.panelMyNodesList);
  try {
    this.initializeNoCatch(input);
  } catch (e) {
    panel.innerHTML = `Failed to parse my node information. ${e}`;
  }
}

MyNodesContainer.prototype.parseMyNodes = function () {
  this.myNodes = {};
  for (var label in this.myNodesRaw) {
    var incomingData = this.myNodesRaw[label];
    this.myNodes[label] = new MyNode({
      id: label,
      ipAddress: incomingData.ipAddress,
      user: incomingData.user,
      sshKey: incomingData.sshKey,
    });
  }
}

MyNodesContainer.prototype.initializeNoCatch = function(input) {
  var panel = document.getElementById(ids.defaults.myNodes.panelMyNodesList);
  var inputParsed = JSON.parse(input);
  if (inputParsed.myNodes === null || inputParsed.myNodes === undefined) {
    panel.innerHTML = `No nodes found`;
    return;
  }
  this.myNodesRaw = inputParsed.myNodes;
  this.parseMyNodes();
  this.writeMyNodesHTML();
}

MyNodesContainer.prototype.writeMyNodesHTML = function() {
  var panel = document.getElementById(ids.defaults.myNodes.panelMyNodesList);
  var radioHTML = "";
  radioHTML += "<table>";

  radioHTML += "<tr><td>";
  radioHTML += `<label class = "containerRadioButton">`;
  radioHTML += `<input type = "radio" name = "${ids.defaults.radioGroups.myNodesList}" id = "radioButtonMyNodesSelectAll" `;
  radioHTML += ` onchange = "window.kanban.myNodes.selectAll()" `; 
  radioHTML += "checked";
  radioHTML += `>`;
  radioHTML += `<span class = "radioMark"></span>`;
  radioHTML += `all`;
  radioHTML += `</label>`;
  radioHTML += "</td></tr>";

  for (var label in this.myNodes) {
    radioHTML += "<tr><td>";
    radioHTML += this.myNodes[label].toHtmlRadio();
    radioHTML += "</td>";
    radioHTML += "<td>";
    radioHTML += this.myNodes[label].ipAddress;
    radioHTML += "</td>";
    radioHTML += "</tr>"
  }
  radioHTML += "</table>";
  panel.innerHTML = radioHTML;
  this.selectAll();
}

var myNodes = new MyNodesContainer();

module.exports = {
  myNodes
}