"use strict";

function setTheme (themeName) {
  console.log("DEBIG: theme name: " + themeName);
  let root = document.documentElement;
  if (themeName === "Light") {
    root.style.setProperty("--colorBackgroundDefault", "white");
    root.style.setProperty("--colorFontDefault", "black");
  }
  if (themeName === "Dark") {
    root.style.setProperty("--colorBackgroundDefault", "rgba(0,0,0,0.85)");
    root.style.setProperty("--colorFontDefault", "white");
  }
}

module.exports = {
  setTheme
}