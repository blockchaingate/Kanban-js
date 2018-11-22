"use strict";
const fs = require('fs');
const pathnames = require('./pathnames');
const browserify = require('browserify');
require('colors');

function buildFrontEnd() {
  //Run browserify
  console.log(`Proceeding to browserify ${pathnames.pathname.frontEndNONBrowserifiedJS} into: ${pathnames.pathname.frontEndBrowserifiedJS}`.yellow);
  var theBrowserifier = browserify();
  theBrowserifier.add(pathnames.pathname.frontEndNONBrowserifiedJS);
  var theFileStream = fs.createWriteStream(pathnames.pathname.frontEndBrowserifiedJS);
  theBrowserifier.bundle().pipe(theFileStream).on('finish', function(){
    console.log(`Browserification of ${pathnames.pathname.frontEndBrowserifiedJS} successful.`.green);
  });
  return;
}

module.exports = {
  buildFrontEnd
}