Async = require("async")
FilterCollection = require("./filterCollection")
Logger = require("../common/logger")
Path = require("path")
Shell = require("projmate-shell")
Task = require("./task")
Util = require("util")
_ = require("lodash")

log = Logger.getLogger("runner")

# Runs the command line app.
#
class Runner

  constructor: (@options) ->
    global.PROJMATE = {}
    PROJMATE.encoding = "utf8"
    @tasks = {}
    @program = @options.program
    @server = @options.server

  # Gets the wrapped filters, array of Filter.partialProcess
  #
  filters: (userFilters...) ->
    # Start with official filters
    unless @filterCollection
      @filterCollection = new FilterCollection
      @filterCollection.loadPackage "projmate-filters"

    if userFilters.length > 0
      for filterPackage in userFilters
        @filterCollection.loadPackage filterPackage

    @filterCollection.filters


  # Gets the shell object which contains cross-platform shell helpers.
  #
  shell: (@shellOptions = {}) -> Shell


  # Registers one or more tasks.
  #
  # @param {Object} tasksDef The tasks JSON definition.
  #
  registerTasks: (tasksDef) ->
    for name, definition of tasksDef
      task = new Task
        name: name
        config: definition
        filters: @filters()
        log: Logger.getLogger("T.#{name}")
        program: @program
      @tasks[name] = task
    null


  # Executes the environment pipeline including their dependecies
  # in one or more tasks.
  #
  # Note, tasks are only run once!
  #
  # @param {Array} taskNames
  #
  executeTasks: (taskNames, cb) =>
    that = @
    Async.eachSeries taskNames, (name, cb) ->
      task = that.tasks[name]
      if !task
        return cb("Invalid task: #{name}")

      if task.dependencies.length > 0
        that.executeTasks task.dependencies, (err) ->
          if err
            cb err
          else
            task.execute cb
      else
        task.execute cb
    , (err) ->
      if err
        log.error err
        log.error "FAIL"
      cb err
    null


module.exports = Runner
