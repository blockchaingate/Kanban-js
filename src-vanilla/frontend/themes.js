"use strict";
const ids = require('./ids_dom_elements');
const storage = require('./storage').storage;

var currentThemeName = "Light";

/**@type {Object.<string, {radio: string, colors: {background: string, font: string}}>} */
var allThemes = {
  light: {
    radio: ids.defaults.themes.radios.light,
    colors: {
      background: "white",
      font: "black",
    }
  },
  dark: {
    radio: ids.defaults.themes.radios.dark,
    colors: {
      background: "rgba(0,0,0,0.85)",
      font: "white",
    }
  },
};

function setTheme(themeName) {
  var currentTheme = allThemes[themeName];
  var theRadioButton = document.getElementById(currentTheme.radio);
  if (theRadioButton === null) {
    return;
  }
  if (!theRadioButton.checked) {
    theRadioButton.checked = true;
  }
  if (currentThemeName === themeName) {
    return;
  }
  currentThemeName = themeName;
  let root = document.documentElement;
  root.style.setProperty("--colorBackgroundDefault", currentTheme.colors.background);
  root.style.setProperty("--colorFontDefault", currentTheme.colors.font);
  storage.setVariable(storage.variables.theme, themeName);
}

module.exports = {
  setTheme
}