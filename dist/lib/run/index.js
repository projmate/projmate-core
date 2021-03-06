/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Fs, Path, Runner, Server, Str, loadProjfile, log, _run;

Runner = require("./runner");

Fs = require("fs");

Path = require("path");

log = require("../common/logger").getLogger("run");

Str = require("underscore.string");

Server = require("../serve/server");

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
  var program, projfile, projfilePath, runner;
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
  return runner.loadProject(projfile.project, function(err) {
    if (err) {
      return cb(err);
    }
    return executeTasks({
      runner: runner,
      projfile: projfile,
      projfilePath: projfilePath
    }, cb);
  });
};

exports.run = function(options, cb) {
  var executeTasks, pjfile, program, startTime, tasks;
  startTime = Date.now();
  program = options.program;
  tasks = program.tasks;
  pjfile = null;
  executeTasks = function(args, cb) {
    var projfile, projfilePath, runner;
    runner = args.runner, projfile = args.projfile, projfilePath = args.projfilePath;
    pjfile = projfile;
    process.chdir(Path.dirname(projfilePath));
    return runner.executeTasks(tasks, cb);
  };
  return _run(options, executeTasks, function(err) {
    var dirname, elapsed, endTime, serve, serveOptions, serverConfig;
    if (err) {
      return cb(err);
    }
    serve = program.serve;
    serverConfig = pjfile.server;
    if (serve) {
      dirname = serve;
      if (dirname.length > 0) {
        serveOptions = {
          dirname: dirname
        };
      } else if (serverConfig) {
        serveOptions = serverConfig;
      } else {
        serveOptions = {
          dirname: "."
        };
      }
      return Server.run(serveOptions);
    } else {
      endTime = Date.now();
      elapsed = endTime - startTime;
      if (!program.watch) {
        log.info("OK - " + (elapsed / 1000) + " seconds");
      }
      return cb();
    }
  });
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
