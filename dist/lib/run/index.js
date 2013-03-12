// Generated by CoffeeScript 1.6.1
(function() {
  var Fs, Path, Runner, loadProjfile, _run;

  Runner = require("./runner");

  Fs = require("fs");

  Path = require("path");

  loadProjfile = function(projfilePath) {
    var extname;
    console.log("projfilePath", projfilePath);
    if (!Fs.existsSync(projfilePath)) {
      throw new Error("Projfile does not exist: " + projfilePath);
    }
    extname = Path.extname(projfilePath);
    if (extname === ".coffee") {
      try {
        require("coffee-script");
      } catch (ex) {
        throw new Error("coffee-script could not be loaded, is it installed?");
        process.exit(1);
      }
    }
    return require(projfilePath);
  };

  _run = function(options, cb) {
    var executeTasks, program, projfile, projfilePath, runner;
    if (!options.program) {
      return cb("Options.program is required");
    }
    if (!options.projfilePath) {
      return cb("Options.projfilePath is required");
    }
    if (!options.executeTasks) {
      return cb("Options.executeTasks is required");
    }
    program = options.program, projfilePath = options.projfilePath, executeTasks = options.executeTasks;
    runner = new Runner({
      program: program
    });
    projfile = loadProjfile(projfilePath);
    if (!projfile.project) {
      return cb("" + projfilePath + " missing `project` function");
    }
    if (projfile.project.length === 1) {
      projfile.project(runner);
      executeTasks(runner, projfilePath(cb));
    } else {
      projfile.project(runner, function(err) {
        if (err) {
          return cb(err);
        }
        return executeTasks(runner, projfilePath, cb);
      });
    }
    return cb();
  };

  exports.run = function(options, cb) {
    var tasks;
    tasks = options.program.tasks;
    options.executeTasks = function(runner, projfilePath, err) {
      if (err) {
        return log.error(err);
      }
      process.chdir(Path.dirname(projfilePath));
      return runner.executeTasks(tasks, cb);
    };
    return _run(options, cb);
  };

  exports.taskDescriptions = function(options, cb) {
    options.executeTasks = function(err) {
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
    return _run(options, cb);
  };

}).call(this);
