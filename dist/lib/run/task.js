/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Async, Chokidar, Filter, Task, TaskProcessor, Util, minimatch, str, _;

_ = require("lodash");

Async = require("async");

Chokidar = require("chokidar");

Filter = require("./filter");

TaskProcessor = require("./taskProcessor");

Util = require("util");

minimatch = require("minimatch");

str = require("underscore.string");

Task = (function() {

  function Task(options) {
    var config, log, name, _ref;
    this.options = options;
    _ref = this.options, log = _ref.log, name = _ref.name, config = _ref.config;
    this.program = this.options.program;
    this.config = config;
    this.log = log;
    this.assets = null;
    this.name = name;
    this.description = config._desc || config._description || "";
    this.dependencies = config._pre || config._deps || config._dependencies || [];
    this.filters = this.options.filters;
    this.pipelines = {};
    this._initPipelines(config);
  }

  Task.prototype._initPipelines = function(config) {
    var filter, i, name, notUnderscored, pipeline, _i, _j, _len, _len1, _results;
    notUnderscored = _(config).keys().reject(function(name) {
      return name.indexOf('_') === 0;
    }).value();
    _results = [];
    for (_i = 0, _len = notUnderscored.length; _i < _len; _i++) {
      name = notUnderscored[_i];
      pipeline = config[name];
      if (Array.isArray(pipeline)) {
        if (!(pipeline[0] instanceof this.filters.loadFiles)) {
          pipeline.unshift(this.filters.loadFiles);
        }
        for (i = _j = 0, _len1 = pipeline.length; _j < _len1; i = ++_j) {
          filter = pipeline[i];
          if (typeof filter === 'undefined') {
            throw new Error("Undefined filter at " + this.name + ":" + name + "[" + i + "]");
          }
          if (!(typeof filter === "function" || filter instanceof Filter)) {
            throw new Error("Invalid filter at " + this.name + ":" + name + "[" + i + "]");
          }
        }
      }
      _results.push(this.pipelines[name] = {
        pipeline: pipeline,
        ran: false
      });
    }
    return _results;
  };

  Task.prototype._watch = function(cb) {
    var checkExecute, dir, dirRe, log, paths, pattern, patterns, subdirRe, that, watcher, _files, _i, _len;
    if (this.watching) {
      return;
    }
    this.watching = true;
    _files = this.config._files;
    dir = str.strLeft();
    subdirRe = /(.*)\/\*\*\/\*(\..*)$/;
    dirRe = /(.*)\/\*(\..*)$/;
    patterns = _files.watch ? _files.watch : _files.include;
    paths = [];
    for (_i = 0, _len = patterns.length; _i < _len; _i++) {
      pattern = patterns[_i];
      dir = str.strLeft(pattern, '*');
      paths.push(dir);
    }
    log = this.log;
    paths = _.unique(paths);
    watcher = Chokidar.watch(paths, {
      ignored: /^\./,
      ignoreInitial: true,
      persistent: true
    });
    that = this;
    log = this.log;
    checkExecute = function(action, path) {
      var _j, _len1;
      log.debug("`" + path + "` " + action);
      for (_j = 0, _len1 = patterns.length; _j < _len1; _j++) {
        pattern = patterns[_j];
        if (minimatch(path, pattern)) {
          return that.execute(function(err) {
            if (err) {
              return log.error(err);
            } else {
              return log.info("rebuilt");
            }
          });
        }
      }
    };
    watcher.on("add", function(path) {
      return checkExecute("added", path);
    });
    watcher.on("change", _.debounce((function(path) {
      return checkExecute("changed", path);
    }), 300));
    return this.log.info("Watching " + this.name + ":" + this.program.environment, paths);
  };

  Task.prototype._executeFunctionTask = function(fn, cb) {
    var ex, that, watch;
    that = this;
    watch = this.program.watch;
    if (fn.length === 1) {
      return fn(function(err) {
        if (err) {
          return cb(err);
        }
        if (watch) {
          that._watch();
        }
        return cb();
      });
    } else {
      try {
        fn();
        if (watch) {
          that._watch();
        }
        return cb();
      } catch (_error) {
        ex = _error;
        return cb(ex);
      }
    }
  };

  Task.prototype._executePipeline = function(pipeline, cb) {
    var log, that, watch;
    that = this;
    watch = this.program.watch;
    log = this.log;
    return Async.eachSeries(pipeline, function(wrappedFilter, cb) {
      var filter;
      if (!wrappedFilter) {
        log.error("PIPELINE", Util.inspect(wrappedFilter));
      }
      if (!wrappedFilter._process) {
        wrappedFilter = wrappedFilter();
      }
      filter = wrappedFilter;
      if (filter instanceof TaskProcessor) {
        return filter._process(that, function(err) {
          if (err) {
            filter.log.error(err);
          }
          return cb(err);
        });
      } else if (filter instanceof Filter) {
        return Async.eachSeries(that.assets, function(asset, cb) {
          if (filter.canProcess(asset)) {
            return filter._process(asset, function(err, result) {
              if (err) {
                asset.err = err;
                filter.log.error("Error", err);
                return cb(err);
              } else {
                return cb();
              }
            });
          } else {
            return cb();
          }
        }, cb);
      } else {
        return cb("Unrecognized filter:", filter);
      }
    }, function(err) {
      if (watch) {
        that._watch();
      }
      return cb();
    });
  };

  Task.prototype.execute = function(cb) {
    var environment, pipeObj, pipeline, ran, that;
    that = this;
    environment = this.program.environment;
    if (!this.pipelines[environment]) {
      environment = "development";
    }
    pipeObj = this.pipelines[environment];
    if (!pipeObj) {
      if (this.dependencies.length > 0) {
        return cb();
      } else {
        this.log.info("Pipeline not found: " + environment);
        return cb();
      }
    }
    pipeline = pipeObj.pipeline, ran = pipeObj.ran;
    if (!this.watching && ran) {
      this.log.debug("skipping " + this.name + ":" + environment + ", already ran");
      return cb();
    }
    this.log.info("" + this.name + ":" + environment);
    if (typeof pipeline === "function") {
      this._executeFunctionTask(pipeline, cb);
    } else {
      this._executePipeline(pipeline, cb);
    }
    return pipeObj.ran = true;
  };

  return Task;

})();

module.exports = Task;
