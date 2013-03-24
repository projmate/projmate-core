/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Fs, Pkg, Server, findProjfile, main, program;

Pkg = require("../../package.json");

program = require("commander");

Server = require("../lib/serve/server");

Fs = require("fs");

findProjfile = function() {
  var file, files, _i, _len;

  files = ['Projfile.js', 'Projfile.coffee'];
  for (_i = 0, _len = files.length; _i < _len; _i++) {
    file = files[_i];
    if (Fs.existsSync(file)) {
      return file;
    }
  }
  return null;
};

main = function() {
  var ex;

  try {
    program.dirname = program.args[0] || ".";
    return Server.run(program);
  } catch (_error) {
    ex = _error;
    return console.error(ex.toString());
  }
};

program.version(Pkg.version).usage("[dirname] [options]").option("-p, --http-port <port>", "HTTP port").option("-P, --https-port <ssl port>", "HTTPS port").parse(process.argv);

main();


/*
//@ sourceMappingURL=src/cli/pm-serve.map
*/