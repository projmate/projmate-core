// Generated by CoffeeScript 1.5.0
(function() {
  var Fs, Logger, PackageJson, Path, Program, Runner, Str, findProjfile, findUpDir, loadProjfile, log, taskDescriptions, version;

  Fs = require("fs");

  Logger = require("../../dist/lib/common/logger");

  PackageJson = require("../../package.json");

  Path = require("path");

  Program = require("commander");

  Runner = require("../../dist/lib/pm-build/runner");

  Str = require("underscore.string");

  log = Logger.getLogger("pm-build");

  version = PackageJson.version;

  Program.version(version).option("-e, --environment [env]", "Set build environment", "development").option("-f, --projfile [file]", "Set project file", "").option("-w, --watch", "Watch and rerun tasks as needed").parse(process.argv);

  findUpDir = function(basename, dir) {
    var parent;
    if (dir == null) {
      dir = process.cwd();
    }
    if (Fs.existsSync(Path.join(dir, basename))) {
      return dir;
    }
    parent = Path.normalize(Path.join(dir, ".."));
    if (parent !== dir) {
      return findUpDir(basename, parent);
    } else {
      return null;
    }
  };

  findProjfile = function() {
    var dir, files, projfile, _i, _len;
    files = [Program.projfile, "Projfile.js", "Projfile.coffee"];
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      projfile = files[_i];
      if (projfile) {
        dir = findUpDir(projfile);
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
    var cwd, executeTasks, proj, projfile, runner;
    try {
      projfile = findProjfile();
      runner = new Runner();
      runner.program = Program;
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
          desc.push(Str.sprintf("  %-" + L + "s  " + taskDesc, name));
        }
        return cb(null, desc.sort().join("\n"));
      };
      if (proj.project.length === 1) {
        proj.project(runner);
        return executeTasks();
      } else {
        return proj.project(runner, executeTasks);
      }
    } catch (e) {
      return log.error(e);
    }
  };

  loadProjfile = function() {
    var extname, moduleName, projfile;
    projfile = findProjfile();
    if (!projfile) {
      return;
    }
    extname = Path.extname(projfile);
    if (extname === ".coffee") {
      try {
        require("coffee-script");
      } catch (ex) {
        throw new Error("coffee-script could not be loaded, is it installed?");
        process.exit(1);
      }
    }
    moduleName = Path.join(Path.dirname(projfile), Path.basename(projfile, extname));
    return require(moduleName);
  };

  exports.run = function() {
    var cwd, executeTasks, proj, projfile, runner, tasks;
    try {
      tasks = Program.args.slice(1);
      projfile = findProjfile();
      log.debug(".\n  environment: " + Program.environment + "\n  projfile: " + projfile);
      runner = new Runner();
      runner.program = Program;
      cwd = process.cwd();
      process.chdir(Path.dirname(projfile));
      proj = loadProjfile();
      if (!proj.project) {
        throw new Error("" + projfile + " does not export `project` function");
      }
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
    } catch (e) {
      return log.error(e);
    }
  };

  exports.meta = {
    name: "build",
    description: "Builds a project",
    quickUsage: function() {
      return "" + (taskDescriptions());
    },
    usage: function(cb) {
      return taskDescriptions(function(err, descriptions) {
        if (err) {
          return cb(err);
        }
        return cb("Builds environment tasks in Projfile (v" + version + ")\n\nUsage: pm build TASKS OPTIONS\n\nTASKS\n" + descriptions + "\n\nOPTIONS\n  -e, --environment=ENV_NAME  Build environment, default 'development'\n  -f, --projfile=PROJFILE     Custom project file\n  -w, --watch                 Watch and rebuild tasks as needed");
      });
    }
  };

}).call(this);
