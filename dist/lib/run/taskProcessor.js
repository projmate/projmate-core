/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Filter, TaskProcessor,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Filter = require("./filter");

TaskProcessor = (function(_super) {

  __extends(TaskProcessor, _super);

  function TaskProcessor() {
    TaskProcessor.__super__.constructor.apply(this, arguments);
  }

  TaskProcessor.prototype.process = function() {
    throw new Error("TaskProcessor.process must be overridden");
  };

  return TaskProcessor;

})(Filter);

module.exports = TaskProcessor;
