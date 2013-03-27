/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Async, FilterCollection, Logger, Path, Runner, Shell, Task, Util, When, log, logError, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

Async = require("async");

FilterCollection = require("./filterCollection");

Logger = require("../common/logger");

Path = require("path");

Shell = require("projmate-shell");

Task = require("./task");

Util = require("util");

_ = require("lodash");

When = require("when");

log = Logger.getLogger("runner");

logError = function(err) {
  if (err && err !== "PM_SILENT") {
    return log.error(err);
  }
};

Runner = (function() {
  function Runner(options) {
    this.options = options;
    this.executeTasks = __bind(this.executeTasks, this);
    global.PROJMATE = {};
    PROJMATE.encoding = "utf8";
    this.tasks = {};
    this.program = this.options.program;
    this.server = this.options.server;
    this._initFilters();
    this.defer = When.defer;
    this.f = this.filterCollection.filters;
    this.t = this.tasks;
    this.$ = Shell;
  }

  Runner.prototype._initFilters = function() {
    this.filterCollection = new FilterCollection;
    return this.filterCollection.loadPackage("projmate-filters");
  };

  Runner.prototype.filters = function() {
    var filterPackage, userFilters, _i, _len;

    userFilters = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (userFilters.length > 0) {
      for (_i = 0, _len = userFilters.length; _i < _len; _i++) {
        filterPackage = userFilters[_i];
        this.filterCollection.loadPackage(filterPackage);
      }
    }
    return this.filterCollection.filters;
  };

  Runner.prototype.shell = function(shellOptions) {
    this.shellOptions = shellOptions != null ? shellOptions : {};
    return Shell;
  };

  Runner.prototype.registerTasks = function(tasksDef, ns) {
    var definition, name, nsname, task;

    if (ns == null) {
      ns = "";
    }
    for (name in tasksDef) {
      definition = tasksDef[name];
      if (ns.length > 0) {
        nsname = ns + ":" + name;
      } else {
        nsname = name;
      }
      task = new Task({
        ns: ns,
        name: nsname,
        config: definition,
        filters: this.filters(),
        log: Logger.getLogger("T." + nsname),
        program: this.program
      });
      this.tasks[nsname] = task;
    }
    return null;
  };

  Runner.prototype.executeTasks = function(taskNames, cb) {
    var that;

    if (!this.project) {
      return cb("load() must be called first.");
    }
    that = this;
    Async.eachSeries(taskNames, function(name, cb) {
      var task, _i, _len, _ref;

      task = that.tasks[name];
      if (!task) {
        return cb("Invalid task: " + name);
      }
      if (task.dependencies.length > 0) {
        _ref = task.dependencies;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          name = _ref[_i];
          if (!that.tasks[name]) {
            task.log.error("Invalid dependency: " + name);
            return cb("PM_SILENT");
          }
        }
        task.log.debug("BEGIN T." + task.name + " deps");
        return that.executeTasks(task.dependencies, function(err) {
          if (err) {
            return cb(err);
          } else {
            if (task.dependencies) {
              task.log.debug("END T." + task.name + " deps");
            }
            return task.execute(cb);
          }
        });
      } else {
        return task.execute(cb);
      }
    }, function(err) {
      if (err) {
        if (err !== "PM_SILENT") {
          log.error(err);
        }
        log.error("FAIL");
      }
      return cb(err);
    });
    return null;
  };

  Runner.prototype.load = function(projfile, ns, cb) {
    var tasks, that;

    if (typeof ns === "function") {
      cb = ns;
      ns = "";
    }
    if (!cb) {
      cb = logError;
    }
    that = this;
    this.project = projfile.project;
    if (!this.project) {
      log.error("Invalid Projfile, missing or does not export `project` property.");
      return cb("PM_SILENT");
    }
    if (this.project.length === 1) {
      tasks = this.project(this);
      this.registerTasks(tasks, ns);
      return cb();
    } else {
      return this.project(this, function(err, tasks) {
        if (err) {
          return cb(err);
        }
        that.registerTasks(tasks, ns);
        return cb();
      });
    }
  };

  return Runner;

})();

module.exports = Runner;


/*
//@ sourceMappingURL=runner.map
*/