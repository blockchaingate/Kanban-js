"use strict";
const fs = require('fs');
const pathnames = require('./pathnames');
const browserify = require('browserify');
const colors = require('colors');

function buildFrontEnd() {
  console.log(`Process ${process.pid} running.`.green);
  //Run browserify
  var theBrowserifier = browserify();
  theBrowserifier.add(pathnames.pathname.frontEndNONBrowserifiedJS);
  var theFileStream = fs.createWriteStream(pathnames.pathname.frontEndBrowserifiedJS);
  console.log(`Proceeding to browserify ${pathnames.pathname.frontEndBrowserifiedJS}`.yellow);
  theBrowserifier.bundle().pipe(theFileStream).on('finish', function(){
    console.log(`Browserification of ${pathnames.pathname.frontEndBrowserifiedJS} successful.`.green);
  });
  return;
}

module.exports = {
  buildFrontEnd
}