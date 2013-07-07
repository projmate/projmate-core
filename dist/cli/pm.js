/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Fs, Logger, Path, color, log, name, pkg, program;

Fs = require("fs");

Path = require("path");

color = require('mgutz-colors').color;

Logger = require('../lib/common/logger');

log = Logger.getLogger('pm');

process.on("uncaughtException", function(err) {
  var message;
  message = err;
  if (err.stack) {
    message = err.stack;
  }
  return log.error("Uncaught exception", message);
});

pkg = require("../../package.json");

program = require("commander");

name = ('  Projmate v' + pkg.version).slice(-Logger.rootConfig.columnWidths[0]);

console.log("" + (color(name, 'yellow+h')) + " " + (color(Path.resolve(__dirname + '/../..'), 'yellow')));

program.version(pkg.version).extbang({
  ".js": "node"
}, __dirname).command("create", "Creates a project from git repo").command("filter", "Prints filter metadata").command("run", "Runs one or more tasks in Projfile").command("serve", "Serves pages from directory HTTP/HTTPS").parse(process.argv);

program._name = 'pm';
