CoffeeFill = require("./common/coffeeFill")
Filter = require("./pm-run/filter")
TaskProcessor = require("./pm-run/taskProcessor")

Projmate =
  FileAsset: require("./pm-run/fileAsset")
  Filter: Filter
  TaskProcessor: TaskProcessor
  Utils: require("./common/utils")
  extendsFilter: (derived) ->
    CoffeeFill.extends(derived, Filter)
  extendsTaskProcessor: (derived) ->
    CoffeeFill.extends(derived, TaskProcessor)

module.exports = Projmate
