var $, Fs, Helpers, Logger, Path, Pkg, Program, Run, Utils, log, run, taskDescriptions;

Program = require("commander");

Pkg = require("../../package.json");

Fs = require("fs");

Logger = require("../lib/common/logger");

Path = require("path");

Run = require("../lib/run");

Utils = require("../lib/common/utils");

log = Logger.getLogger("pm-run");

$ = require('projmate-shell');

Helpers = require('./helpers');

process.on('SIGINT', function() {
  $.killAll();
  return process.reallyExit();
});

run = function() {
  var e, projfilePath;
  try {
    Program.tasks = Program.args;
    projfilePath = Helpers.findProjfile(Program);
    if (!Program.environment) {
      if (Program.dev) {
        Program.environment = "development";
      }
      if (Program.test) {
        Program.environment = "test";
      }
      if (Program.prod) {
        Program.environment = "production";
      }
      if (Program.release) {
        Program.environment = "production";
      }
      if (Program.environment == null) {
        Program.environment = "development";
      }
    }
    log.info("env: " + Program.environment + " file: " + (Utils.relativeToCwd(projfilePath)));
    return Run.run({
      program: Program,
      projfilePath: projfilePath
    }, function(err) {
      if (err) {
        if (err !== "PM_SILENT") {
          log.error(err);
        }
      }
      if (!$.hasChildProcesses()) {
        return process.exit();
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
    projfilePath = Helpers.findProjfile(Program);
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

Program._name = 'pm run';

if (process.argv.length < 3) {
  Program.outputHelp();
} else {
  run();
}


/*
//@ sourceMappingURL=pm-run.map
*/