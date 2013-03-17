/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Filter, Logger, S, Util, _;

Logger = require("../common/logger");

Util = require("util");

_ = require("lodash");

S = require("string");

Filter = (function() {

  function Filter(name, config, processOptions) {
    this.name = name;
    this.config = config != null ? config : {};
    this.processOptions = processOptions != null ? processOptions : {};
    this.log = Logger.getLogger("F." + this.name);
    _.extend(this, this.config);
    if (!this.extnames) {
      throw new Error("`extnames` is required for filter " + this.name);
    }
    if (!Array.isArray(this.extnames)) {
      this.extnames = [this.extnames];
    }
  }

  Filter.prototype.process = function(asset, options, cb) {
    throw new Error("`process` must be implemented by filter.");
  };

  Filter.prototype.canProcess = function(asset) {
    var filename;
    if (this.extnames.indexOf("*") >= 0) {
      return true;
    }
    filename = asset.filename;
    return _.any(this.extnames, function(extname) {
      return S(filename).endsWith(extname);
    });
  };

  Filter.prototype.checkAssetModifiers = function(assetOrTask) {
    var $asset, args, asset, assets, chain, fn, isAsset, modifiers, prop, reserved, _i, _len, _ref, _results;
    $asset = this.processOptions.$asset;
    _ref = ["_filename"];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      reserved = _ref[_i];
      if (this.processOptions[reserved]) {
        if ($asset == null) {
          $asset = {};
        }
        $asset[reserved.slice(1)] = this.processOptions[reserved];
      }
    }
    if ($asset) {
      isAsset = assetOrTask.originalFilename != null;
      assets = isAsset ? [assetOrTask] : assertOrTask.assets;
      _results = [];
      for (prop in $asset) {
        modifiers = $asset[prop];
        _results.push((function() {
          var _j, _len1, _results1;
          _results1 = [];
          for (_j = 0, _len1 = assets.length; _j < _len1; _j++) {
            asset = assets[_j];
            chain = S(asset[prop]);
            for (fn in modifiers) {
              args = modifiers[fn];
              if (typeof args === 'string') {
                args = [args];
              }
              chain = chain[fn].apply(chain, args);
            }
            _results1.push(asset[prop] = chain.s);
          }
          return _results1;
        })());
      }
      return _results;
    }
  };

  Filter.prototype.setRunDefaults = function(options) {
    var defaults, env;
    if (!(this.environment && this.defaults)) {
      return;
    }
    env = this.environment;
    defaults = this.defaults;
    if (env === "development" && (defaults.development != null)) {
      _.defaults(options, defaults.development);
    } else if (env === "test" && (defaults.test != null)) {
      _.defaults(options, defaults.test);
    } else if (env === "production" && (defaults.production != null)) {
      _.defaults(options, defaults.production);
    }
    return options;
  };

  Filter.prototype._process = function(assetOrTask, cb) {
    var inspect, isAsset, log, options, that;
    that = this;
    log = this.log;
    inspect = this.processOptions.$inspect;
    isAsset = assetOrTask.originalFilename != null;
    if (inspect) {
      log.debug("Asset BEFORE", "\n" + assetOrTask.toString());
    }
    this.checkAssetModifiers(assetOrTask);
    options = _.clone(this.processOptions);
    this.setRunDefaults(options);
    if (isAsset && assetOrTask.__merge) {
      _.extend(options, assetOrTask.__merge);
    }
    return this.process(assetOrTask, options, function(err, result) {
      if (err) {
        if (assetOrTask.filename) {
          log.error("Processing " + assetOrTask.filename + " ...");
        }
        return cb(err);
      }
      if (isAsset && typeof result !== "undefined") {
        if (result.text) {
          assetOrTask.text = result.text;
        } else {
          assetOrTask.text = result;
        }
        if (result.outExtName) {
          assetOrTask.extname = result.outExtname;
        } else {
          if (that.outExtname) {
            assetOrTask.extname = that.outExtname;
          }
        }
      }
      if (inspect) {
        log.debug("Asset AFTER", "\n" + assetOrTask.toString());
      }
      return cb(null, result);
    });
  };

  return Filter;

})();

module.exports = Filter;
