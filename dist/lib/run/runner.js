/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Async, FilterCollection, Fs, Logger, Path, Runner, Shell, Task, Util, Vow, log, logError, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __slice = [].slice;

Async = require('async');

FilterCollection = require('./filterCollection');

Logger = require('../common/logger');

Fs = require('fs');

Path = require('path');

Shell = require('projmate-shell');

Task = require('./task');

Util = require('util');

_ = require('lodash');

Vow = require('vow');

log = Logger.getLogger('runner');

logError = function(err) {
  if (err && err !== 'PM_SILENT') {
    return log.error(err);
  }
};

Runner = (function() {
  function Runner(options) {
    var shellLog;
    this.options = options;
    this.executeTasks = __bind(this.executeTasks, this);
    global.PROJMATE = {};
    PROJMATE.encoding = 'utf8';
    this._tasks = {};
    this.program = this.options.program;
    this.server = this.options.server;
    this._initFilters();
    this.Utils = require('../common/utils');
    this.f = this.filterCollection.factories;
    this.t = this._tasks;
    this.$ = Shell;
    shellLog = Logger.getLogger('shell');
    Shell.info = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return shellLog.info.apply(shellLog, args);
    };
    Shell.log = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return shellLog.log.apply(shellLog, args);
    };
    Shell.error = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return shellLog.error.apply(shellLog, args);
    };
  }

  Runner.prototype._initFilters = function() {
    this.filterCollection = new FilterCollection;
    this.filterCollection.loadPackage('projmate-filters');
    return this.watchList = {};
  };

  Runner.prototype.filters = function() {
    var args, _ref;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (args.length > 0) {
      (_ref = this.filterCollection).load.apply(_ref, args);
    }
    return this.filterCollection.factories;
  };

  Runner.prototype.shell = function(shellOptions) {
    this.shellOptions = shellOptions != null ? shellOptions : {};
    return Shell;
  };

  Runner.prototype.registerTasks = function(tasksDef, options) {
    var cwd, definition, name, ns, nsname, task;
    if (options == null) {
      options = {};
    }
    ns = options.ns || '';
    cwd = options.cwd;
    if (!(cwd && Fs.existsSync(cwd))) {
      throw new Error('Options.cwd is required');
    }
    for (name in tasksDef) {
      definition = tasksDef[name];
      if (ns.length > 0) {
        nsname = ns + ':' + name;
      } else {
        nsname = name;
      }
      task = new Task({
        cwd: Path.resolve(cwd),
        ns: ns,
        name: nsname,
        config: definition,
        filters: this.filters(),
        log: Logger.getLogger("" + nsname),
        program: this.program
      });
      this._tasks[nsname] = task;
    }
    return this;
  };

  Runner.prototype.watchTasks = function() {
    var name, task, that, _results;
    that = this;
    _results = [];
    for (name in this.watchList) {
      task = this._tasks[name];
      _results.push(task.watch());
    }
    return _results;
  };

  Runner.prototype.executeTasks = function(taskNames, cb) {
    var that, watching;
    if (!this.project) {
      return cb('load() must be called first.');
    }
    that = this;
    watching = this.program.watch;
    Async.eachSeries(taskNames, function(name, cb) {
      var task, _i, _len, _ref;
      task = that._tasks[name];
      if (!task) {
        return cb("Invalid task: " + name);
      }
      if (watching && task.hasPipeline()) {
        that.watchList[name] = true;
      }
      if (task.dependencies.length > 0) {
        _ref = task.dependencies;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          name = _ref[_i];
          if (!that._tasks[name]) {
            task.log.error("Invalid dependency: " + name);
            return cb('PM_SILENT');
          }
        }
        task.log.debug("BEGIN deps[" + (task.dependencies.join(', ')) + "]");
        return that.executeTasks(task.dependencies, function(err) {
          if (err) {
            task.log.error(err);
            return cb('PM_SILENT');
          } else {
            task.log.debug("END deps");
            return task.execute(cb);
          }
        });
      } else {
        return task.execute(cb);
      }
    }, function(err) {
      if (err) {
        if (err !== 'PM_SILENT') {
          log.error(err);
        }
        return cb('PM_SILENT');
      }
      return cb(err);
    });
    return null;
  };

  Runner.prototype.processConfig = function(projfile) {
    var _ref;
    if (!projfile.config) {
      return;
    }
    if ((_ref = projfile.config.log) != null ? _ref.level : void 0) {
      return Logger.setLevels(projfile.config.log.level);
    }
  };

  Runner.prototype.load = function(projfile, options, cb) {
    var self, tasks;
    if (options == null) {
      options = {};
    }
    if (options.cwd == null) {
      options.cwd = process.cwd();
    }
    if (options.ns == null) {
      options.ns = '';
    }
    if (typeof options === 'function') {
      cb = options;
    }
    if (!cb) {
      cb = logError;
    }
    this.processConfig(projfile);
    self = this;
    this.project = projfile.project;
    if (!this.project) {
      log.error('Invalid Projfile, missing or does not export `project` property.');
      return cb('PM_SILENT');
    }
    if (this.project.length === 1) {
      tasks = this.project(this);
      this.registerTasks(tasks, options);
      return cb();
    } else {
      return this.project(this, function(err, tasks) {
        if (err) {
          return cb(err);
        }
        self.registerTasks(tasks, options);
        return cb();
      });
    }
  };

  return Runner;

})();

module.exports = Runner;
