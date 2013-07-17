/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Assets, Async, Chokidar, Filter, Task, TaskProcessor, Util, Utils, minimatch, noop, str, _;

_ = require("lodash");

Async = require("async");

Chokidar = require("chokidar");

Filter = require("./filter");

TaskProcessor = require("./taskProcessor");

Util = require("util");

minimatch = require("minimatch");

str = require("underscore.string");

Assets = require("./assets");

Utils = require('../common/utils');

noop = function() {};

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
    this.singleFileWatch = true;
    this._initPipelines(config);
    this.cwd = cwd;
  }

  Task.prototype.hasPipeline = function() {
    return Object.keys(this.pipelines).length > 0;
  };

  Task.prototype.normalizeConfig = function(config, ns) {
    var dep, i, _i, _len, _ref, _ref1;
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
    Utils.normalizeFiles(config, 'files');
    Utils.normalizeFiles(config, 'watch');
    if ((_ref = config.files) != null) {
      _ref.originalInclude = config.files.include.slice(0);
    }
    config.description = config.desc || config.description || ("Runs " + this.name + " task");
    config.dependencies = config.pre || config.deps || config.dependencies || [];
    if (typeof config.dependencies === "string") {
      config.dependencies = [config.dependencies];
    }
    if (config.development == null) {
      config.development = config.dev;
    }
    if (config.production == null) {
      config.production = config.prod;
    }
    if (ns.length > 0) {
      _ref1 = config.dependencies;
      for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
        dep = _ref1[i];
        config.dependencies[i] = ns + ":" + dep;
      }
    }
    if (!config.environments) {
      config.environments = ["production", "test", "development"];
    }
    return config;
  };

  Task.prototype._initPipelines = function(config) {
    var alternateLoader, filter, i, name, pipeline, _i, _j, _len, _len1, _ref, _results;
    this.singleFileWatch = true;
    _ref = config.environments;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      pipeline = config[name];
      if (!pipeline) {
        continue;
      }
      if (Array.isArray(pipeline)) {
        pipeline = _.flatten(pipeline);
        filter = pipeline[0];
        alternateLoader = filter.useLoader;
        if (alternateLoader) {
          pipeline.unshift(this.filters[alternateLoader]);
        } else if (filter.isAssetLoader == null) {
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
          if (!filter._process) {
            filter = pipeline[i] = filter();
          }
          if (i === 0 && ['loadFiles', 'stat'].indexOf(filter.name) > -1) {

          } else if (filter instanceof TaskProcessor) {
            this.singleFileWatch = false;
          }
        }
      } else if (typeof pipeline !== 'function') {
        throw new Error("Pipeline is neither [filters] or function: " + this.name + ":" + name);
      }
      _results.push(this.pipelines[name] = {
        pipeline: pipeline,
        ran: false
      });
    }
    return _results;
  };

  Task.prototype.watch = function() {
    var checkExecute, customWatch, dir, dirRe, files, log, paths, pattern, patterns, subdirRe, that, watch, watcher, _i, _len, _ref;
    if (this.watching) {
      return;
    }
    this.watching = true;
    _ref = this.config, files = _ref.files, watch = _ref.watch;
    if (!(files || watch)) {
      return;
    }
    subdirRe = /(.*)\/\*\*\/\*(\..*)$/;
    dirRe = /(.*)\/\*(\..*)$/;
    customWatch = (watch != null ? watch.include : void 0) != null;
    patterns = customWatch ? watch.include : files.include;
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
      var filename, _j, _k, _len1, _len2, _ref1, _ref2;
      log.debug("`" + path + "` " + action);
      for (_j = 0, _len1 = patterns.length; _j < _len1; _j++) {
        pattern = patterns[_j];
        if (minimatch(path, pattern)) {
          filename = null;
          if (that.singleFileWatch) {
            if (customWatch && (files != null ? (_ref1 = files.include) != null ? _ref1.length : void 0 : void 0) > 0) {
              _ref2 = files.include;
              for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
                pattern = _ref2[_k];
                if (minimatch(path, pattern)) {
                  filename = path;
                  break;
                }
              }
            } else {
              filename = path;
            }
          }
          return that.execute(filename, function(err) {
            if (err) {
              return log.error(err);
            } else {
              return log.info('rebuilt');
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
    return this.log.info("Watching " + (paths.join(', ')));
  };

  Task.prototype._executeFunctionTask = function(fn, cb) {
    var env, environment, ex, that, timeout, timeoutId, watch;
    that = this;
    watch = this.program.watch;
    environment = this.program.environment;
    fn.environment = environment;
    if (fn.length === 1) {
      timeoutId = null;
      env = {
        environment: environment,
        timeout: 2000
      };
      fn.call(env, function(err) {
        if (cb) {
          clearTimeout(timeoutId);
          if (err) {
            return cb(err);
          }
          return cb();
        }
      });
      timeout = env.timeout;
      return timeoutId = setTimeout(function() {
        clearTimeout(timeoutId);
        cb('Execution exceeded ' + timeout + 'ms. Check callback was called or set `this.timeout = ms` to increase allowed time');
        return cb = null;
      }, timeout);
    } else {
      try {
        fn();
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
        log.error("PIPELINE", wrappedFilter);
      }
      if (!wrappedFilter._process) {
        wrappedFilter = wrappedFilter();
      }
      filter = wrappedFilter;
      filter.environment = environment;
      if (filter instanceof TaskProcessor || filter.name === "intrude") {
        return filter._process(that, cb);
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
      return cb(err);
    });
  };

  Task.prototype.execute = function(filename, cb) {
    var environment, pipeObj, pipeline, ran, that;
    if (typeof filename === 'function') {
      cb = filename;
      filename = null;
    }
    if (this.config.files != null) {
      if (filename) {
        this.config.files.include = [filename];
      } else {
        this.config.files.include = this.config.files.originalInclude;
      }
    }
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
    this.log.debug("==> " + this.name + "." + environment);
    if (typeof pipeline === "function") {
      return this._executeFunctionTask(pipeline, function(err) {
        pipeObj.ran = !err;
        return cb(err);
      });
    } else if (Array.isArray(pipeline)) {
      return this._executePipeline(pipeline, function(err) {
        pipeObj.ran = !err;
        return cb(err);
      });
    } else {
      return cb('unrecognized pipeline: ' + typeof pipeline);
    }
  };

  return Task;

})();

module.exports = Task;
