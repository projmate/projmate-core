var CoffeeFill, Filter, Projmate, TaskProcessor;

CoffeeFill = require("./common/coffeeFill");

Filter = require("./pm-run/filter");

TaskProcessor = require("./pm-run/taskProcessor");

Projmate = {
  FileAsset: require("./pm-run/fileAsset"),
  Filter: Filter,
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
