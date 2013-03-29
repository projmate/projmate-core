Async = require("async")
FilterCollection = require("./filterCollection")
Logger = require("../common/logger")
Path = require("path")
Shell = require("projmate-shell")
Task = require("./task")
Util = require("util")
_ = require("lodash")
When = require("when")

log = Logger.getLogger("runner")
logError = (err) ->
  log.error(err) if err and err isnt "PM_SILENT"

# Runs the command line app.
#
class Runner

  constructor: (@options) ->
    global.PROJMATE = {}
    PROJMATE.encoding = "utf8"
    @tasks = {}
    @program = @options.program
    @server = @options.server
    @_initFilters()

    #
    @defer = When.defer
    @f = @filterCollection.filters
    @t = @tasks
    @$ = Shell

  _initFilters: ->
    # Start with official filters
    @filterCollection = new FilterCollection
    @filterCollection.loadPackage "projmate-filters"


  # Gets the wrapped filters, array of Filter.partialProcess
  #
  filters: (userFilters...) ->
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
  registerTasks: (tasksDef, ns="") ->
    for name, definition of tasksDef
      if ns.length > 0
        nsname = ns+":"+name
      else
        nsname = name

      task = new Task
        ns: ns
        name: nsname
        config: definition
        filters: @filters()
        log: Logger.getLogger("T.#{nsname}")
        program: @program
      @tasks[nsname] = task
    null


  # Executes the environment pipeline including their dependecies
  # in one or more tasks.
  #
  # Note, tasks are only run once!
  #
  # @param {Array} taskNames
  #
  executeTasks: (taskNames, cb) =>
    return cb("load() must be called first.") unless @project
    that = @
    Async.eachSeries taskNames, (name, cb) ->
      task = that.tasks[name]
      if !task
        return cb("Invalid task: #{name}")

      if task.dependencies.length > 0

        # for usability only
        for name in task.dependencies
          if !that.tasks[name]
            task.log.error "Invalid dependency: #{name}"
            return cb("PM_SILENT")

        task.log.debug "BEGIN T.#{task.name} deps"

        that.executeTasks task.dependencies, (err) ->
          if err
            console.error err
            cb err
          else
            task.log.debug("END T.#{task.name} deps") if task.dependencies
            task.execute cb
      else
        task.execute cb
    , (err) ->
      if err
        log.error(err) if err != "PM_SILENT"
        cb "PM_SILENT"
      cb err
    null


  # Loads a project.
  #
  # @param {Object} project The Projfile exported project.
  # @param {Function} cb
  #
  load: (projfile, ns, cb)  ->
    if typeof ns == "function"
      cb = ns
      ns = ""
    cb = logError unless cb

    that = @
    @project = projfile.project
    unless @project
      log.error "Invalid Projfile, missing or does not export `project` property."
      return cb("PM_SILENT")

    if @project.length == 1
      tasks = @project(@)
      @registerTasks tasks, ns
      cb()
    else
      @project @, (err, tasks) ->
        return cb(err) if err
        that.registerTasks tasks, ns
        cb()

module.exports = Runner
