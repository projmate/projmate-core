Filter = require("./filter")

##
# Modifies task properties such as the `assets` properties which contains
# the set of files a task builds against.
#
class TaskProcessor extends Filter
  constructor: ->
    super
  process: ->
    throw new Error("TaskProcessor.process must be overridden")


module.exports = TaskProcessor

