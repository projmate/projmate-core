Async = require('async')
FilterCollection = require('./filterCollection')
Logger = require('../common/logger')
Fs = require('fs')
Path = require('path')
Shell = require('projmate-shell')
Task = require('./task')
Util = require('util')
_ = require('lodash')
Vow = require('vow')

log = Logger.getLogger('runner')
logError = (err) ->
  log.error(err) if err and err isnt 'PM_SILENT'

# Runs the command line app.
#
# NOTE: Runner is passed as the argument to exports.project callback
class Runner

  constructor: (@options) ->
    global.PROJMATE = {}
    PROJMATE.encoding = 'utf8'
    @_tasks = {}
    @program = @options.program
    @server = @options.server
    @_initFilters()
    @Utils = require('../common/utils')

    # expose single letter aliases
    @f = @filterCollection.factories
    @t = @_tasks

    @$ = Shell
    shellLog = Logger.getLogger('shell')
    Shell.info = (args...) -> shellLog.info args...
    Shell.log = (args...) -> shellLog.log args...
    Shell.error = (args...) -> shellLog.error args...

  _initFilters: ->
    # Start with official filters
    @filterCollection = new FilterCollection
    @filterCollection.loadPackage 'projmate-filters'
    @watchList = {}


  # Gets the wrapped filters, array of Filter.partialProcess
  #
  filters: (userFilters...) ->
    if userFilters.length > 0
      for filterPackage in userFilters
        @filterCollection.loadPackage filterPackage
    @filterCollection.factories


  # Gets the shell object which contains cross-platform shell helpers.
  #
  shell: (@shellOptions = {}) -> Shell


  # Registers one or more tasks.
  #
  # @param {Object} tasksDef The tasks JSON definition.
  #
  registerTasks: (tasksDef, options={}) ->
    ns = options.ns || ''
    cwd = options.cwd

    throw new Error('Options.cwd is required') unless cwd and Fs.existsSync(cwd)

    for name, definition of tasksDef
      if ns.length > 0
        nsname = ns+':'+name
      else
        nsname = name

      task = new Task
        cwd: Path.resolve(cwd)
        ns: ns
        name: nsname
        config: definition
        filters: @filters()
        log: Logger.getLogger("#{nsname}")
        program: @program
      @_tasks[nsname] = task

    # # Track forward dependencies for smart watching
    # for nsname, task of @_tasks
    #   # if a task doesn't have a pipeline, meaning it just run dependencies, then
    #   # id doesn't need to be executed as this task has been run by the watch trigger
    #   if Object.keys(task.pipelines).length > 0
    #     for dependantNsname in task.dependencies
    #       dependant = @_tasks[dependantNsname]
    #       dependant.forwardDependencies ?= []
    #       dependant.forwardTasks ?= []
    #       if dependant.forwardDependencies.indexOf(nsname) < 0
    #         dependant.forwardDependencies.push nsname
    #         dependant.forwardTasks.push task
    #   else
    #     log.debug "Skipping #{task.name} as a forward dependency"

    # for nsname, task of @_tasks
    #   log.debug "#{task.name}.dependencies #{task.dependencies}"
    #   log.debug "#{task.name}.forwardDependencies #{task.forwardDependencies}"
    @


  # Watch tasks which were collected as each task was run in executeTasks
  watchTasks: ->
    that = @
    for name of @watchList
      task = @_tasks[name]
      task.watch()


  # Executes the environment pipeline including their dependecies
  # in one or more tasks.
  #
  # Note, tasks are only run once!
  #
  # @param {Array} taskNames
  #
  executeTasks: (taskNames, cb) =>
    return cb('load() must be called first.') unless @project
    that = @
    watching = @program.watch
    Async.eachSeries taskNames, (name, cb) ->
      task = that._tasks[name]
      if !task
        return cb("Invalid task: #{name}")

      # Watch tasks only if they have processing to do. Watches are applied
      # after all tasks have run.
      if watching and task.hasPipeline()
        that.watchList[name] = true

      if task.dependencies.length > 0

        # for usability only
        for name in task.dependencies
          if !that._tasks[name]
            task.log.error "Invalid dependency: #{name}"
            return cb('PM_SILENT')

        task.log.debug "BEGIN deps[#{task.dependencies. join(', ')}]"

        that.executeTasks task.dependencies, (err) ->
          if err
            task.log.error err
            return cb('PM_SILENT')
          else
            task.log.debug("END deps")
            task.execute cb
      else
        task.execute cb
    , (err) ->
      if err
        log.error(err) if err != 'PM_SILENT'
        return cb 'PM_SILENT'
      cb err
    null

  processConfig: (projfile) ->
    return unless projfile.config

    if projfile.config.log?.level
      Logger.setLevels projfile.config.log.level


  # Loads a project.
  #
  # @param {Object} project The Projfile exported project.
  # @param {Function} cb
  #
  load: (projfile, options={}, cb)  ->
    options.cwd ?= process.cwd()
    options.ns ?= ''
    if typeof options == 'function'
      cb = options
    cb = logError unless cb

    @processConfig projfile

    self = @
    @project = projfile.project
    unless @project
      log.error 'Invalid Projfile, missing or does not export `project` property.'
      return cb('PM_SILENT')

    if @project.length == 1
      tasks = @project(@)
      @registerTasks tasks, options
      cb()
    else
      @project @, (err, tasks) ->
        return cb(err) if err
        self.registerTasks tasks, options
        cb()

module.exports = Runner
