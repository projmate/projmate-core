CoffeeFill = require("./common/coffeeFill")
Filter = require("./run/filter")
TaskProcessor = require("./run/taskProcessor")

Projmate =
  FileAsset: require("./run/fileAsset")
  Filter: Filter
  String: require("string")
  TaskProcessor: TaskProcessor
  Utils: require("./common/utils")
  extendsFilter: (derived) ->
    CoffeeFill.extends(derived, Filter)
  extendsTaskProcessor: (derived) ->
    CoffeeFill.extends(derived, TaskProcessor)
  eventBus: require("./common/eventBus")

module.exports = Projmate
