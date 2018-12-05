"use strict";
const ids = require('./ids_dom_elements');
const storageKanban = require('./storage').storageKanban;

var currentThemeName = "Light";

/**@type {Object.<string, {radio: string, colors: {background: string, font: string}}>} */
var allThemes = {
  light: {
    radio: ids.defaults.themes.radios.light,
    colors: {
      "--colorBackgroundDefault": "white",
      "--colorFontDefault": "black",
      "--colorButtonBackgroundStandard": "lightblue",
      "--colorButtonFontStandard": "black",
      "--colorButtonStandardHovered": "lightskyblue",
      "--colorButtonStandardSelected": "skyblue",
      "--colorBackgroundTooltip": "lightgray",
      "--colorBackgroundUsedAsInput": "lightgreen",   
      "--colorBackgroundUpdatedRecently": "lightcyan",
      "--colorBackgroundButtonProgressHover": "lightgray",
      "--colorBorderPanel": "black",
      "--colorBorderMenuSeparator": "black",
      "--colorButtonBackgroundRPCInput": "#f3f3f3",
      "--colorButtonFontRPCInput": "black",
      "--colorButtonBackgroundHoverRPCInput": "lightcyan",
    }
  },
  dark: {
    radio: ids.defaults.themes.radios.dark,
    colors: {
      "--colorBackgroundDefault": "rgba(0,0,0,0.85)",
      "--colorFontDefault": "white",
      "--colorButtonBackgroundStandard": "darkblue",
      "--colorButtonFontStandard": "white",
      "--colorButtonStandardHovered": "blue",
      "--colorButtonStandardSelected": "blue",
      "--colorBackgroundTooltip": "white",
      "--colorBackgroundUsedAsInput": "green",    
      "--colorBackgroundUpdatedRecently": "blue",
      "--colorBackgroundButtonProgressHover": "#555555",
      "--colorBorderPanel": "white",
      "--colorBorderMenuSeparator": "white",
      "--colorButtonBackgroundRPCInput": "#33333",
      "--colorButtonFontRPCInput": "white",
      "--colorButtonBackgroundHoverRPCInput": "darkblue",
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
  for (var colorLabel in currentTheme.colors) {
    root.style.setProperty(colorLabel, currentTheme.colors[colorLabel]);
  }
  storageKanban.setVariable(storageKanban.variables.theme, themeName);
}

module.exports = {
  setTheme
}