/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Fs, Path, Runner, Str, loadProjfile, log, _run;

Runner = require("./runner");

Fs = require("fs");

Path = require("path");

log = require("../common/logger").getLogger("run");

Str = require("underscore.string");

loadProjfile = function(projfilePath) {
  var ex, extname;
  if (!Fs.existsSync(projfilePath)) {
    throw new Error("Projfile does not exist: " + projfilePath);
  }
  extname = Path.extname(projfilePath);
  if (extname === ".coffee") {
    try {
      require("coffee-script");
    } catch (_error) {
      ex = _error;
      throw new Error("coffee-script could not be loaded, is it installed?");
      process.exit(1);
    }
  }
  return require(projfilePath);
};

_run = function(options, executeTasks, cb) {
  var execArgs, program, projfile, projfilePath, runner;
  if (!options.program) {
    return cb("Options.program is required");
  }
  if (!options.projfilePath) {
    return cb("Options.projfilePath is required");
  }
  program = options.program, projfilePath = options.projfilePath;
  projfile = loadProjfile(projfilePath);
  if (!projfile.project) {
    return cb("" + projfilePath + " missing `project` function");
  }
  runner = new Runner({
    program: program,
    server: projfile.server
  });
  execArgs = {
    runner: runner,
    projfile: projfile,
    projfilePath: projfilePath
  };
  if (projfile.project.length === 1) {
    projfile.project(runner);
    return executeTasks(execArgs, cb);
  } else {
    return projfile.project(runner, function(err) {
      if (err) {
        return cb(err);
      }
      return executeTasks(execArgs, cb);
    });
  }
};

exports.run = function(options, cb) {
  var executeTasks, tasks;
  tasks = options.program.tasks;
  executeTasks = function(args, cb) {
    var projfile, projfilePath, runner;
    runner = args.runner, projfile = args.projfile, projfilePath = args.projfilePath;
    process.chdir(Path.dirname(projfilePath));
    return runner.executeTasks(tasks, cb);
  };
  return _run(options, executeTasks, cb);
};

exports.taskDescriptions = function(options, cb) {
  var executeTasks;
  executeTasks = function(args, cb) {
    var L, desc, name, projfile, projfilePath, runner, task, taskDesc, _ref;
    runner = args.runner, projfile = args.projfile, projfilePath = args.projfilePath;
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
  return _run(options, executeTasks, cb);
};