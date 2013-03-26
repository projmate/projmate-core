/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Fs, Logger, Path, Pkg, Program, Run, Utils, findProjfile, log, run, taskDescriptions;

Path = require("path");

Program = require("commander");

Pkg = require("../../package.json");

Fs = require("fs");

Logger = require("../lib/common/logger");

Path = require("path");

Run = require("../lib/run");

Utils = require("../lib/common/utils");

log = Logger.getLogger("pm-run");

findProjfile = function() {
  var file, files, projfile, _i, _len;

  files = [Program.projfile, "Projfile.js", "Projfile.coffee"];
  for (_i = 0, _len = files.length; _i < _len; _i++) {
    file = files[_i];
    if (!((file != null ? file.length : void 0) > 0)) {
      continue;
    }
    projfile = Path.resolve(file);
    if (Fs.existsSync(projfile)) {
      return projfile;
    }
  }
  if (Program.projfile) {
    throw new Error("Projfile not found: " + Program.projfile);
  } else {
    throw new Error("Projfile not found in " + (process.cwd()) + " or any of its parent directories");
  }
  return null;
};

run = function() {
  var e, projfilePath;

  try {
    Program.tasks = Program.args;
    projfilePath = findProjfile();
    log.info("env: " + Program.environment + " file: " + (Utils.relativeToCwd(projfilePath)));
    return Run.run({
      program: Program,
      projfilePath: projfilePath
    }, function(err) {
      if (err) {
        if (err !== "PM_SILENT") {
          return log.error(err);
        }
      } else {
        return process.reallyExit();
      }
    });
  } catch (_error) {
    e = _error;
    return log.error(e);
  }
};

taskDescriptions = function(cb) {
  var e, projfilePath;

  try {
    projfilePath = findProjfile();
    return Run.taskDescriptions({
      program: Program,
      projfilePath: projfilePath
    }, cb);
  } catch (_error) {
    e = _error;
    return log.error(e);
  }
};

Program.on("--help", function() {
  return taskDescriptions(function(err, tasks) {
    if (err) {
      return log.error(err);
    } else {
      console.log("  Tasks:");
      console.log("");
      return console.log(tasks);
    }
  });
});

Program.version(Pkg.version).option("-e, --environment <env>", "Set build environment", "development").option("-f, --projfile <file>", "Set project file", "").option("-w, --watch", "Watch and rerun tasks as needed").option("-s, --serve [dir]", "Runs HTTP/HTTPS server").usage("TASKS [options]").parse(process.argv);

if (process.argv.length < 3) {
  Program.outputHelp();
} else {
  run();
}


/*
//@ sourceMappingURL=pm-run.map
*/