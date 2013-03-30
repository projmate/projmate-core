/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Assets, Async, Chokidar, Filter, Task, TaskProcessor, Util, blackhole, minimatch, str, _;

_ = require("lodash");

Async = require("async");

Chokidar = require("chokidar");

Filter = require("./filter");

TaskProcessor = require("./taskProcessor");

Util = require("util");

minimatch = require("minimatch");

str = require("underscore.string");

Assets = require("./assets");

blackhole = function() {};

Task = (function() {
  function Task(options) {
    var config, cwd, log, name, _ref;

    this.options = options;
    _ref = this.options, cwd = _ref.cwd, log = _ref.log, name = _ref.name, config = _ref.config;
    this.name = name;
    config = this.normalizeConfig(config, this.options.ns);
    this.program = this.options.program;
    this.config = config;
    this.log = log;
    this.description = config.description;
    this.dependencies = config.dependencies;
    this.filters = this.options.filters;
    this.pipelines = {};
    this._initPipelines(config);
    this.cwd = cwd;
  }

  Task.prototype.normalizeFiles = function(config, prop) {
    var configFiles, excludePattern, files, pattern, removePatterns, _i, _len, _ref;

    configFiles = config[prop];
    if (configFiles) {
      if (typeof configFiles === "string") {
        files = configFiles;
        config[prop] = configFiles = {
          include: [files]
        };
      }
      if (Array.isArray(configFiles)) {
        configFiles = {
          include: configFiles
        };
      }
      if (typeof configFiles.include === "string") {
        configFiles.include = [configFiles.include];
      }
      if (typeof configFiles.exclude === "string") {
        configFiles.exclude = [configFiles.exclude];
      }
      if (!Array.isArray(configFiles.exclude)) {
        configFiles.exclude = [];
      }
      removePatterns = [];
      if (Array.isArray(configFiles.include)) {
        _ref = configFiles.include;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          pattern = _ref[_i];
          if (pattern.indexOf("!") === 0) {
            removePatterns.push(pattern);
            excludePattern = pattern.slice(1);
            if (str.endsWith(excludePattern, '/')) {
              configFiles.exclude.push(excludePattern);
              configFiles.exclude.push(excludePattern + "/**/*");
            } else {
              configFiles.exclude.push(excludePattern);
            }
          }
        }
      }
      return configFiles.include = _.reject(configFiles.include, function(pattern) {
        return removePatterns.indexOf(pattern) >= 0;
      });
    }
  };

  Task.prototype.normalizeConfig = function(config, ns) {
    var dep, i, _i, _len, _ref, _ref1, _ref2;

    if (ns == null) {
      ns = "";
    }
    if (Array.isArray(config)) {
      config = {
        pre: config
      };
    }
    if (typeof config === "function") {
      config = {
        development: config
      };
    }
    if (typeof config === "string") {
      config = {
        pre: [config]
      };
    }
    this.normalizeFiles(config, 'files');
    this.normalizeFiles(config, 'watch');
    config.description = config.desc || config.description || ("Runs " + this.name + " task");
    config.dependencies = config.pre || config.deps || config.dependencies || [];
    if (typeof config.dependencies === "string") {
      config.dependencies = [config.dependencies];
    }
    if ((_ref = config.development) == null) {
      config.development = config.dev;
    }
    if ((_ref1 = config.production) == null) {
      config.production = config.prod;
    }
    if (ns.length > 0) {
      _ref2 = config.dependencies;
      for (i = _i = 0, _len = _ref2.length; _i < _len; i = ++_i) {
        dep = _ref2[i];
        config.dependencies[i] = ns + ":" + dep;
      }
    }
    if (!config.environments) {
      config.environments = ["production", "test", "development"];
    }
    return config;
  };

  Task.prototype._initPipelines = function(config) {
    var filter, i, load, name, pipeline, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _results;

    _ref = config.environments;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      pipeline = config[name];
      if (!pipeline) {
        continue;
      }
      if (Array.isArray(pipeline)) {
        for (_j = 0, _len1 = pipeline.length; _j < _len1; _j++) {
          filter = pipeline[_j];
          if (!filter) {
            throw new Error("Undefined filter for " + this.name + ":" + name);
          }
          load = !((_ref1 = filter.__pragma) != null ? _ref1.disableLoadFiles : void 0);
          if (load) {
            break;
          }
        }
        if (load) {
          if (!(pipeline[0] instanceof this.filters.loadFiles)) {
            pipeline.unshift(this.filters.loadFiles);
          }
        } else {
          if (!(pipeline[0] instanceof this.filters.loadFilenames)) {
            pipeline.unshift(this.filters.loadFilenames);
          }
        }
        for (i = _k = 0, _len2 = pipeline.length; _k < _len2; i = ++_k) {
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
    var checkExecute, dir, dirRe, files, log, paths, pattern, patterns, subdirRe, that, watch, watcher, _i, _len, _ref;

    if (this.watching) {
      return;
    }
    this.watching = true;
    _ref = this.config, files = _ref.files, watch = _ref.watch;
    if (!files) {
      return;
    }
    subdirRe = /(.*)\/\*\*\/\*(\..*)$/;
    dirRe = /(.*)\/\*(\..*)$/;
    patterns = (watch != null ? watch.include : void 0) ? watch.include : files.include;
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
    }), 1250));
    return this.log.info("Watching " + this.name + "." + this.program.environment, paths);
  };

  Task.prototype._executeFunctionTask = function(fn, cb) {
    var environment, ex, that, timeout, timeoutId, watch;

    that = this;
    watch = this.program.watch;
    environment = this.program.environment;
    fn.environment = environment;
    if (fn.length === 1) {
      timeoutId = null;
      fn(function(err) {
        clearTimeout(timeoutId);
        if (err) {
          return cb(err);
        }
        if (watch) {
          that._watch();
        }
        return cb();
      });
      timeout = fn.timeout || 2000;
      return timeoutId = setTimeout(function() {
        return cb('Function exceed ' + timeout + 'ms. Check callback was called or `this.timeout(ms)` increases it');
      }, timeout);
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
          return cb(err);
        });
      } else if (filter instanceof Filter) {
        return Async.eachSeries(that.assets.array(), function(asset, cb) {
          var i, _i, _len, _ref;

          if (that.assets.detect(function(asset) {
            return !asset;
          })) {
            _ref = that.assets.array();
            for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
              asset = _ref[i];
              if (asset) {
                log.debug("asset[" + i + "].filename=" + asset.filename);
              } else {
                log.debug("asset[" + i + "] is undefined");
              }
            }
          }
          if (filter.canProcess(asset)) {
            return filter._process(asset, function(err, result) {
              if (err) {
                asset.err = err;
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
      return cb(err);
    });
  };

  Task.prototype.execute = function(cb) {
    var environment, pipeObj, pipeline, ran, that;

    this.assets = new Assets;
    that = this;
    if (this.cwd && process.cwd() !== this.cwd) {
      this.log.debug('Changing to task\'s work directory: ' + this.cwd);
      process.chdir(this.cwd);
    }
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
      cb('unrecognized pipeline: ' + typeof pipeline);
    }
    return pipeObj.ran = true;
  };

  return Task;

})();

module.exports = Task;
