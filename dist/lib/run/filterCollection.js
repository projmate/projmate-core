var Filter, FilterCollection, Projmate, _;

_ = require("lodash");

Filter = require("./filter");

Projmate = require("..");

FilterCollection = (function() {
  function FilterCollection() {
    this.factories = {};
    this._filterClasses = {};
  }

  FilterCollection.prototype.loadPackage = function(packageName) {
    var modules;
    modules = require(packageName);
    return this.load(modules);
  };

  FilterCollection.prototype.load = function(name, fn) {
    var FilterClass, classFactory, obj, that, _results;
    if (_.isString(name)) {
      obj = {};
      obj[name] = fn;
    } else if (_.isObject(name)) {
      obj = name;
    } else {
      console.error(arguments);
      throw new Error('Invalid load filter arguments');
    }
    that = this;
    _results = [];
    for (name in obj) {
      classFactory = obj[name];
      FilterClass = classFactory(Projmate);
      _results.push((function(name, FilterClass) {
        var filter, schema;
        schema = FilterClass.schema;
        if ((schema != null ? schema.__ : void 0) == null) {
          throw new Error("Invalid filter `" + packageName + "." + name + "`: schema.__ is required");
        }
        if (!schema.title) {
          throw new Error("Invalid filter `" + packageName + "." + name + "`: schema.title is required");
        }
        if (!schema.__.extnames) {
          throw new Error("Invalid filter `" + packageName + "." + name + "`: schema.__.extnames is required");
        }
        filter = new FilterClass;
        if (!filter instanceof Filter) {
          throw new Error("Invalid filter " + packageName + "." + name);
        }
        that._filterClasses[name] = FilterClass;
        that.factories[name] = function(processOptions, config) {
          var extnames, instance, newext, prop, val, _i, _len, _ref;
          if (processOptions == null) {
            processOptions = {};
          }
          if (config == null) {
            config = {};
          }
          instance = new FilterClass(name, config, processOptions);
          _ref = ['extnames', 'outExtname', 'isAssetLoader', 'defaults', 'useLoader'];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            prop = _ref[_i];
            val = schema['__'][prop];
            if (val != null) {
              instance[prop] = val;
            }
          }
          if (!Array.isArray(instance.extnames)) {
            instance.extnames = [instance.extnames];
          }
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
        return that.factories[name].schema = FilterClass.schema;
      })(name, FilterClass));
    }
    return _results;
  };

  return FilterCollection;

})();

module.exports = FilterCollection;


/*
//@ sourceMappingURL=filterCollection.map
*/