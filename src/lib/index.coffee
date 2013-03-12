CoffeeFill = require("./common/coffeeFill")
Filter = require("./run/filter")
TaskProcessor = require("./run/taskProcessor")

Projmate =
  FileAsset: require("./run/fileAsset")
  Filter: Filter
  TaskProcessor: TaskProcessor
  Utils: require("./common/utils")
  extendsFilter: (derived) ->
    CoffeeFill.extends(derived, Filter)
  extendsTaskProcessor: (derived) ->
    CoffeeFill.extends(derived, TaskProcessor)

module.exports = Projmate
