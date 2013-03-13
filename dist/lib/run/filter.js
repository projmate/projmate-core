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
    return this.extnames.indexOf("*") >= 0 || this.extnames.indexOf(asset.extname) >= 0;
  };

  Filter.prototype.checkAssetModifiers = function(assetOrTask) {
    var $asset, args, asset, assets, chain, fn, isAsset, modifiers, prop, _results;
    $asset = this.processOptions.$asset;
    if ($asset) {
      isAsset = assetOrTask.originalFilename != null;
      assets = isAsset ? [assetOrTask] : assertOrTask.assets;
      _results = [];
      for (prop in $asset) {
        modifiers = $asset[prop];
        _results.push((function() {
          var _i, _len, _results1;
          _results1 = [];
          for (_i = 0, _len = assets.length; _i < _len; _i++) {
            asset = assets[_i];
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

  Filter.prototype._process = function(assetOrTask, cb) {
    var inspect, log, that;
    that = this;
    log = this.log;
    inspect = this.processOptions.$inspect;
    if (inspect) {
      log.debug("Asset BEFORE", "\n" + assetOrTask.toString());
    }
    this.checkAssetModifiers(assetOrTask);
    return this.process(assetOrTask, _.clone(this.processOptions), function(err, result) {
      var isAsset;
      if (err && assetOrTask.filename) {
        log.error("Processing " + assetOrTask.filename + " ...");
        return cb(err);
      }
      isAsset = assetOrTask.originalFilename != null;
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
