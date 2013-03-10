CoffeeFill = require("./common/coffeeFill")
Filter = require("./pm-build/filter")
TaskProcessor = require("./pm-build/taskProcessor")

Projmate =
  FileAsset: require("./pm-build/fileAsset")
  Filter: Filter
  TaskProcessor: TaskProcessor
  Utils: require("./common/utils")
  extendsFilter: (derived) ->
    CoffeeFill.extends(derived, Filter)
  extendsTaskProcessor: (derived) ->
    CoffeeFill.extends(derived, TaskProcessor)

module.exports = Projmate
