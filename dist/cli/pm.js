// Generated by CoffeeScript 1.6.1
(function() {
  var Fs, Path, glob, pkg, program;

  Fs = require("fs");

  Path = require("path");

  glob = require("multi-glob").glob;

  pkg = require("../../package.json");

  program = require("commander");

  program.version(pkg.version).extbang({
    ".js": "node"
  }, __dirname).command("run", "Runs one or more tasks in Projfile").command("serve", "Serves pages from directory HTTP/HTTPS").parse(process.argv);

}).call(this);
