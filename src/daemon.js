#!/usr/bin/env node
/**
 * Entry point for Kanban daemon
 * 
 */

"use strict";
const daemon = require('daemonize2').setup({
  main: "app.js",
  name: "kanban",
  pidfile: "../kanban.pid"
});

switch (process.argv[2]) {
  case "start":
      daemon.start();
      break;

  case "stop":
      daemon.stop();
      break;

  default:
      console.log("Usage: [start|stop]");
}
