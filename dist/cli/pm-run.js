/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Fs, Logger, Path, Pkg, Program, Runner, Str, Utils, findProjfile, loadProjfile, log, run, taskDescriptions;

Program = require("commander");

Pkg = require("../../package.json");

Fs = require("fs");

Logger = require("../lib/common/logger");

Path = require("path");

Runner = require("../lib/pm-run/runner");

Str = require("underscore.string");

Utils = require("../lib/common/utils");

log = Logger.getLogger("pm-run");

findProjfile = function() {
  var dir, files, projfile, _i, _len;
  files = [Program.projfile, "Projfile.js", "Projfile.coffee"];
  for (_i = 0, _len = files.length; _i < _len; _i++) {
    projfile = files[_i];
    if (projfile) {
      dir = Utils.findDirUp(projfile);
    }
    if (dir) {
      return Path.join(dir, projfile);
    }
  }
  if (Program.projfile) {
    throw new Error("Projfile not found: " + Program.projfile);
  } else {
    throw new Error("Projfile not found in " + (process.cwd()) + " or any of its parent directories");
  }
  return null;
};

taskDescriptions = function(cb) {
  var cwd, e, executeTasks, proj, projfile, runner;
  try {
    projfile = findProjfile();
    runner = new Runner({
      Program: Program
    });
    cwd = process.cwd();
    process.chdir(Path.dirname(projfile));
    proj = loadProjfile();
    if (!proj.project) {
      return cb("" + projfile + " missing `project` function");
    }
    executeTasks = function(err) {
      var L, desc, name, task, taskDesc, _ref;
      if (err) {
        return cb(err);
      }
      desc = [];
      L = 0;
      for (name in runner.tasks) {
        if (name.length > L) {
          L = name.length;
        }
      }
      _ref = runner.tasks;
      for (name in _ref) {
        task = _ref[name];
        if (name.indexOf("_") === 0) {
          continue;
        }
        taskDesc = task.description;
        desc.push(Str.sprintf("    %-" + L + "s  " + taskDesc, name));
      }
      return cb(null, desc.sort().join("\n"));
    };
    if (proj.project.length === 1) {
      proj.project(runner);
      return executeTasks();
    } else {
      return proj.project(runner, executeTasks);
    }
  } catch (_error) {
    e = _error;
    return log.error(e);
  }
};

loadProjfile = function() {
  var ex, extname, moduleName, projfile;
  projfile = findProjfile();
  if (!projfile) {
    return;
  }
  extname = Path.extname(projfile);
  if (extname === ".coffee") {
    try {
      require("coffee-script");
    } catch (_error) {
      ex = _error;
      throw new Error("coffee-script could not be loaded, is it installed?");
      process.exit(1);
    }
  }
  moduleName = Path.join(Path.dirname(projfile), Path.basename(projfile, extname));
  return require(moduleName);
};

run = function() {
  var cwd, e, executeTasks, proj, projfile, runner, tasks;
  try {
    tasks = Program.args;
    projfile = findProjfile();
    log.info("" + Program.environment + ": " + projfile);
    cwd = process.cwd();
    process.chdir(Path.dirname(projfile));
    proj = loadProjfile();
    if (!proj.project) {
      throw new Error("" + projfile + " does not export `project` function");
    }
    runner = new Runner({
      program: Program
    });
    executeTasks = function(err) {
      if (err) {
        return log.error(err);
      }
      return runner.executeTasks(tasks, function(err) {
        if (err) {
          return log.error(err);
        }
      });
    };
    if (proj.project.length === 1) {
      proj.project(runner);
      return executeTasks();
    } else {
      return proj.project(runner, executeTasks);
    }
  } catch (_error) {
    e = _error;
    return log.error(e);
  }
};

Program.on("--help", function() {
  return taskDescriptions(function(err, tasks) {
    if (err) {
      return console.error(err);
    } else {
      console.log("  Tasks:");
      console.log("");
      return console.log(tasks);
    }
  });
});

Program.version(Pkg.version).option("-e, --environment <env>", "Set build environment", "development").option("-f, --projfile <file>", "Set project file", "").option("-w, --watch", "Watch and rerun tasks as needed").option("-s, --serve <dir>", "Runs HTTP/HTTPS server").usage("TASKS [options]").parse(process.argv);

if (process.argv.length < 3) {
  Program.outputHelp();
} else {
  run();
}
