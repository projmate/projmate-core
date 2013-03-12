/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Pkg, Program, Server, main;

Pkg = require("../../package.json");

Program = require("commander");

Server = require("../lib/pm-serve/server");

main = function() {
  var ex;
  try {
    Program.dirname = Program.args[0] || ".";
    return Server.run(Program);
  } catch (_error) {
    ex = _error;
    return console.error(ex.toString());
  }
};

Program.version(Pkg.version).usage("[dirname] [options]").option("-p, --http-port <port>", "HTTP port", 1080).option("-P, --https-port <ssl port>", "HTTPS port", 1443).parse(process.argv);

main();
