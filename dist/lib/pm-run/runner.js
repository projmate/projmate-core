var Async, FilterCollection, Logger, Path, Runner, Sex, Task, Util, log, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

Async = require("async");

FilterCollection = require("./filterCollection");

Logger = require("../common/logger");

Path = require("path");

Sex = require("projmate-shell");

Task = require("./task");

Util = require("util");

_ = require("lodash");

log = Logger.getLogger("runner");

Runner = (function() {

  function Runner(options) {
    this.options = options;
    this.executeTasks = __bind(this.executeTasks, this);
    global.PROJMATE = {};
    PROJMATE.encoding = "utf8";
    this.tasks = {};
    this.program = this.options.program;
  }

  Runner.prototype.filters = function() {
    var filterPackage, userFilters, _i, _len;
    userFilters = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (!this.filterCollection) {
      this.filterCollection = new FilterCollection;
      this.filterCollection.loadPackage("projmate-filters");
    }
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
    return Sex;
  };

  Runner.prototype.registerTasks = function(tasksDef) {
    var definition, name, task;
    for (name in tasksDef) {
      definition = tasksDef[name];
      task = new Task({
        name: name,
        config: definition,
        filters: this.filters(),
        log: Logger.getLogger("tasks." + name),
        program: this.program
      });
      this.tasks[name] = task;
    }
    return null;
  };

  Runner.prototype.executeTasks = function(taskNames, cb) {
    var that;
    that = this;
    Async.eachSeries(taskNames, function(name, cb) {
      var task;
      task = that.tasks[name];
      if (!task) {
        return cb("Invalid task: " + name);
      }
      if (task.dependencies.length > 0) {
        return that.executeTasks(task.dependencies, function(err) {
          if (err) {
            return cb(err);
          } else {
            return task.execute(cb);
          }
        });
      } else {
        return task.execute(cb);
      }
    }, function(err) {
      if (err) {
        log.error(err);
        log.error("FAIL");
      } else {
        if (!that.program.watch) {
          log.info("OK");
        }
        if (that.program.serve) {
          Server.serve({
            dirname: that.program.serve
          });
        }
      }
      return cb(err);
    });
    return null;
  };

  return Runner;

})();

module.exports = Runner;
