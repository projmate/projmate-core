/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Async, Chokidar, Filter, Task, TaskProcessor, Util, blackhole, minimatch, str, _;

_ = require("lodash");

Async = require("async");

Chokidar = require("chokidar");

Filter = require("./filter");

TaskProcessor = require("./taskProcessor");

Util = require("util");

minimatch = require("minimatch");

str = require("underscore.string");

blackhole = function() {};

Task = (function() {

  function Task(options) {
    var config, log, name, _ref;
    this.options = options;
    _ref = this.options, log = _ref.log, name = _ref.name, config = _ref.config;
    this.name = name;
    this.normalizeConfig(config);
    this.program = this.options.program;
    this.config = config;
    this.log = log;
    this.assets = null;
    this.description = config.description;
    this.dependencies = config.dependencies;
    this.filters = this.options.filters;
    this.pipelines = {};
    this._initPipelines(config);
  }

  Task.prototype.normalizeConfig = function(config) {
    var excludePattern, files, pattern, removePatterns, _i, _len, _ref;
    if (config.files) {
      if (typeof config.files === "string") {
        files = config.files;
        config.files = {
          include: [files]
        };
      }
      if (Array.isArray(config.files)) {
        config.files = {
          include: config.files
        };
      }
      if (typeof config.files.include === "string") {
        config.files.include = [config.files.include];
      }
      if (typeof config.files.exclude === "string") {
        config.files.exclude = [config.files.exclude];
      }
      if (!Array.isArray(config.files.exclude)) {
        config.files.exclude = [];
      }
      removePatterns = [];
      if (Array.isArray(config.files.include)) {
        _ref = config.files.include;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          pattern = _ref[_i];
          if (pattern.indexOf("!") === 0) {
            excludePattern = pattern.slice(1);
            removePatterns.push(excludePattern);
            if (str.endsWith(excludePattern, '/')) {
              config.files.exclude.push(excludePattern);
              config.files.exclude.push(excludePattern + "/**/*");
            } else {
              config.files.exclude.push(excludePattern);
            }
          }
        }
      }
      config.files.include = _.reject(config.files.include, function(pattern) {
        return removePatterns.indexOf(pattern) >= 0;
      });
    }
    config.description = config.desc || config.description || ("Runs " + this.name + " task");
    config.dependencies = config.pre || config.deps || config.dependencies || [];
    if (typeof config.dependencies === "string") {
      config.dependencies = [config.dependencies];
    }
    if (!config.environments) {
      config.environments = ["production", "test", "development"];
    }
    return config;
  };

  Task.prototype._initPipelines = function(config) {
    var filter, i, load, name, pipeline, _i, _j, _len, _len1, _ref, _ref1, _results;
    load = ((_ref = config.files) != null ? _ref.load : void 0) != null ? config.files.load : true;
    _ref1 = config.environments;
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      name = _ref1[_i];
      pipeline = config[name];
      if (!pipeline) {
        continue;
      }
      if (Array.isArray(pipeline)) {
        if (load) {
          if (!(pipeline[0] instanceof this.filters.loadFiles)) {
            pipeline.unshift(this.filters.loadFiles);
          }
        } else {
          if (!(pipeline[0] instanceof this.filters.loadFilenames)) {
            pipeline.unshift(this.filters.loadFilenames);
          }
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
    var checkExecute, dir, dirRe, files, log, paths, pattern, patterns, subdirRe, that, watcher, _i, _len;
    if (this.watching) {
      return;
    }
    this.watching = true;
    files = this.config.files;
    dir = str.strLeft();
    subdirRe = /(.*)\/\*\*\/\*(\..*)$/;
    dirRe = /(.*)\/\*(\..*)$/;
    patterns = files.watch ? files.watch : files.include;
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
    return this.log.info("Watching " + this.name + "." + this.program.environment, paths);
  };

  Task.prototype._executeFunctionTask = function(fn, cb) {
    var environment, ex, that, watch;
    that = this;
    watch = this.program.watch;
    environment = this.program.environment;
    fn.environment = environment;
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
    var environment, log, that, watch;
    that = this;
    watch = this.program.watch;
    log = this.log;
    environment = this.program.environment;
    return Async.eachSeries(pipeline, function(wrappedFilter, cb) {
      var filter;
      if (!wrappedFilter) {
        log.error("PIPELINE", Util.inspect(wrappedFilter));
      }
      if (!wrappedFilter._process) {
        wrappedFilter = wrappedFilter();
      }
      filter = wrappedFilter;
      filter.environment = environment;
      if (filter instanceof TaskProcessor) {
        return filter._process(that, function(err) {
          if (err) {
            filter.log.error(err);
          }
          return cb(err);
        });
      } else if (filter instanceof Filter) {
        return Async.eachSeries(that.assets, function(asset, cb) {
          var i, _i, _len;
          if (_(that.assets).detect(function(asset) {
            return !asset;
          })) {
            for (i = _i = 0, _len = assets.length; _i < _len; i = ++_i) {
              asset = assets[i];
              if (asset) {
                console.log("asset[" + i + "].filename=" + asset.filename);
              } else {
                console.log("asset[" + i + "] is undefined");
              }
            }
          }
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
      if (err) {
        console.error(err);
      }
      return cb(err);
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
        this.log.info("Pipeline not found: " + this.name + "." + environment);
        return cb();
      }
    }
    pipeline = pipeObj.pipeline, ran = pipeObj.ran;
    if (!this.watching && ran) {
      this.log.debug("skipping " + this.name + "." + environment + ", already ran");
      return cb();
    }
    this.log.info("==> " + this.name + "." + environment);
    if (typeof pipeline === "function") {
      this._executeFunctionTask(pipeline, cb);
    } else if (Array.isArray(pipeline)) {
      this._executePipeline(pipeline, cb);
    } else {
      console.debug;
    }
    return pipeObj.ran = true;
  };

  return Task;

})();

module.exports = Task;
