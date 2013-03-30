/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Assets, FileAsset, cid, methods, _,
  __slice = [].slice;

FileAsset = require("./fileAsset");

_ = require("lodash");

cid = 1;

Assets = (function() {
  function Assets() {
    this._assets = [];
  }

  Assets.prototype.array = function() {
    return this._assets;
  };

  Assets.prototype.push = function(asset) {
    asset.cid = cid++;
    return this._assets.push(asset);
  };

  Assets.prototype.pop = function() {
    return this._assets.pop();
  };

  Assets.prototype.at = function(index) {
    return this._assets[index];
  };

  Assets.prototype.remove = function(asset) {
    var idx;

    idx = this.indexOf(function(asst) {
      return asst.cid === asset.cid;
    });
    if (idx > -1) {
      this._assets.splice(idx, 1);
    }
    return this._assets;
  };

  Assets.prototype.removeAssets = function(lambda) {
    var l, _results;

    l = this._assets.length;
    _results = [];
    while (l--) {
      if (lambda(this._assets[l])) {
        _results.push(this._assets.splice(l, 1));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  Assets.prototype.reset = function(newAssets) {
    return this._assets = newAssets;
  };

  Assets.prototype.create = function(opts) {
    var asset;

    asset = new FileAsset({
      filename: opts.filename,
      text: opts.text,
      cwd: opts.cwd,
      parent: this,
      stat: opts.stat
    });
    asset.cid = "c" + cid;
    cid += 1;
    this._assets.push(asset);
    return asset;
  };

  Assets.prototype.clear = function() {
    return this._assets.length = 0;
  };

  return Assets;

})();

methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl', 'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke', 'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest', 'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf', 'isEmpty'];

methods.forEach(function(method) {
  return Assets.prototype[method] = function() {
    var args;

    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    args.unshift(this._assets);
    return _[method].apply(_, args);
  };
});

module.exports = Assets;
