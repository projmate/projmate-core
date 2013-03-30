Async = require('async')
FilterCollection = require('./filterCollection')
Logger = require('../common/logger')
Fs = require('fs')
Path = require('path')
Shell = require('projmate-shell')
Task = require('./task')
Util = require('util')
_ = require('lodash')
When = require('when')

log = Logger.getLogger('runner')
logError = (err) ->
  log.error(err) if err and err isnt 'PM_SILENT'

# Runs the command line app.
#
class Runner

  constructor: (@options) ->
    global.PROJMATE = {}
    PROJMATE.encoding = 'utf8'
    @_tasks = {}
    @program = @options.program
    @server = @options.server
    @_initFilters()
    @Utils = require('../common/utils')

    #
    @defer = When.defer
    @f = @filterCollection.filters
    @t = @_tasks
    @$ = Shell

  _initFilters: ->
    # Start with official filters
    @filterCollection = new FilterCollection
    @filterCollection.loadPackage 'projmate-filters'


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
        log: Logger.getLogger("T.#{nsname}")
        program: @program
      @_tasks[nsname] = task
    @


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
    Async.eachSeries taskNames, (name, cb) ->
      task = that._tasks[name]
      if !task
        return cb("Invalid task: #{name}")

      if task.dependencies.length > 0

        # for usability only
        for name in task.dependencies
          if !that._tasks[name]
            task.log.error "Invalid dependency: #{name}"
            return cb('PM_SILENT')

        task.log.debug "BEGIN T.#{task.name} deps[#{task.dependencies. join(', ')}]"

        that.executeTasks task.dependencies, (err) ->
          if err
            console.error err
            cb err
          else
            task.log.debug("END T.#{task.name} deps")
            task.execute cb
      else
        task.execute cb
    , (err) ->
      if err
        log.error(err) if err != 'PM_SILENT'
        cb 'PM_SILENT'
      cb err
    null


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
