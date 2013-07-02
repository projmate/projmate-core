/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Filter, FilterCollection, Projmate, _;

_ = require("lodash");

Filter = require("./filter");

Projmate = require("..");

FilterCollection = (function() {
  function FilterCollection() {
    this.filters = {};
  }

  FilterCollection.prototype.loadPackage = function(packageName) {
    var FilterClass, classFactory, modules, name, that, _results;
    that = this;
    modules = require(packageName);
    _results = [];
    for (name in modules) {
      classFactory = modules[name];
      FilterClass = classFactory(Projmate);
      _results.push((function(name, FilterClass) {
        var filter;
        filter = new FilterClass;
        if (!filter instanceof Filter) {
          throw new Error("Invalid filter " + packageName + "." + name);
        }
        that.filters[name] = function(processOptions, config) {
          var extnames, instance, newext;
          if (processOptions == null) {
            processOptions = {};
          }
          if (config == null) {
            config = {};
          }
          instance = new FilterClass(name, config, processOptions);
          if (processOptions.$addExtname) {
            newext = processOptions.$addExtname;
            extnames = instance.extname;
            if (!Array.isArray(extnames)) {
              extnames = [extnames];
            }
            if (extnames.indexOf("*") < 0 && extnames.indexOf(newext) < 0) {
              extnames.push(newext);
              instance.extname = extnames;
            }
          }
          return instance;
        };
        return that.filters[name].isAssetLoader = filter.isAssetLoader;
      })(name, FilterClass));
    }
    return _results;
  };

  return FilterCollection;

})();

module.exports = FilterCollection;
