/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

/**
 * Support extending Coffee classes from JavaScript.
 *
 * @example
 *   var Filter = require("projmate").Filter;
 *
 *   function YourFilter() {
 *     this.name = "yourFilter";
 *     this.extnames = ".ext";
 *     Filter.apply(this, arguments);
 *   }
 *
 *   CoffeeFill.extends(YourFilter, Filter);
 *
 *   YourFilter.prototype.process = function(asset, options, cb) {...}
 *
 *   module.exports = YourFilter;
 */
"use strict";

exports.extends = function(child, parent) {
  for (var key in parent) {
    if (parent.hasOwnProperty(key)) child[key] = parent[key];
  }

  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype;
  return child;
};

