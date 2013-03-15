/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var CoffeeFill, Filter, Projmate, TaskProcessor;

CoffeeFill = require("./common/coffeeFill");

Filter = require("./run/filter");

TaskProcessor = require("./run/taskProcessor");

Projmate = {
  FileAsset: require("./run/fileAsset"),
  Filter: Filter,
  String: require("string"),
  TaskProcessor: TaskProcessor,
  Utils: require("./common/utils"),
  extendsFilter: function(derived) {
    return CoffeeFill["extends"](derived, Filter);
  },
  extendsTaskProcessor: function(derived) {
    return CoffeeFill["extends"](derived, TaskProcessor);
  }
};

module.exports = Projmate;
