_ = require("lodash")
Async = require("async")
Chokidar = require("chokidar")
Filter = require("./filter")
TaskProcessor = require("./taskProcessor")
Util = require("util")
minimatch = require("minimatch")
str = require("underscore.string")

class Task

  # Creates an instance of this object.
  #
  #
  constructor: (@options) ->
    {log, name, config} = @options

    @program = @options.program

    # init attributes
    @config = config
    @log = log
    @assets = null
    @name = name
    @description = config._desc || config._description || "Runs #{name} task"
    @dependencies = config._pre || config._deps || config._dependencies || []
    @filters = @options.filters

    @pipelines = {}

    @_initPipelines config


  # Normalizes pipeline as a series of filters, prepending `loadFiles` to
  # the pipeline (if needed) to kick things off.
  #
  _initPipelines: (config) ->
    notUnderscored = _(config).keys().reject((name) -> name.indexOf('_') == 0).value()

    # Load by default, some tasks disable loading when the task action
    # does not maninpulate the file. Mocha for example, only needs
    # the filenames not the content.
    load = if config._files?.load? then config._files.load else true

    for name in notUnderscored
      # The pipeline can either be an array of filters, OR a function.
      pipeline = config[name]

      if Array.isArray(pipeline)
        # Each pipeline starts by loading files or just the filenames.
        # Since this is so common, prepend it if it is not declared in
        # pipeline.
        if load
          unless pipeline[0] instanceof @filters.loadFiles
            pipeline.unshift @filters.loadFiles
        else
          unless pipeline[0] instanceof @filters.loadFilenames
            pipeline.unshift @filters.loadFilenames

        # sanity check
        for filter, i in pipeline
          if typeof filter == 'undefined'
            throw new Error("Undefined filter at #{@name}:#{name}[#{i}]")
          unless typeof filter == "function" or filter instanceof Filter
            throw new Error("Invalid filter at #{@name}:#{name}[#{i}]")

      @pipelines[name] = { pipeline, ran: false }


  # Watch files in `_files.watch` or `_files.include` and execute this
  # tasks whenever any matching files changes.
  #
  _watch: (cb) ->
    return if @watching

    @watching = true

    {_files} = @config

    dir = str.strLeft()

    # dir/**/*.ext => match[1] = dirname, match[2] = extname
    subdirRe = /(.*)\/\*\*\/\*(\..*)$/

    # dir/*.ext => match[1] = dirname, match[2] = extname
    dirRe = /(.*)\/\*(\..*)$/

    # Watch patterns can be inferred from `_files.include` but in
    # some cases, a single file includes many other files.
    # In this situation, the dependent files should be monitored
    # and declared via `_files.watch` to trigger building the task properly.
    patterns = if _files.watch then _files.watch else _files.include

    paths = []
    for pattern in patterns
      dir = str.strLeft(pattern, '*')
      paths.push(dir)

    log = @log
    paths = _.unique(paths)
    watcher = Chokidar.watch(paths, ignored: /^\./, ignoreInitial: true, persistent: true)

    that = @
    log = @log
    checkExecute = (action, path) ->
      log.debug "`#{path}` #{action}"
      for pattern in patterns
        if minimatch(path, pattern)
          return that.execute (err) ->
            if err
              log.error(err)
            else
              log.info "rebuilt"

    watcher.on "add", (path) -> checkExecute("added", path)
    watcher.on "change", _.debounce ((path) -> checkExecute("changed", path)), 300
    # watcher.on 'unlink', (path) -> log.debug "`#{path}` removed"
    # watcher.on 'error', (path) -> log.debug "`#{path}` errored"
    #
    @log.info "Watching #{@name}.#{@program.environment}", paths


  _executeFunctionTask: (fn, cb) ->
    that = @
    watch = @program.watch

    if fn.length == 1
      fn (err) ->
        return cb(err) if err
        if watch then that._watch()
        cb()
    else
      try
        fn()
        if watch then that._watch()
        cb()
      catch ex
        cb ex


  _executePipeline: (pipeline, cb) ->
    that = @
    watch = @program.watch
    log = @log

    Async.eachSeries pipeline, (wrappedFilter, cb) ->
      if !wrappedFilter
        log.error "PIPELINE", Util.inspect(wrappedFilter)

      # If wrappedFilter is a function then it is still the wrapper function
      # `wrappedFilter.partialProcess`. To unwrap it, call it with no arguments.
      if !wrappedFilter._process
        wrappedFilter = wrappedFilter()

      filter = wrappedFilter


      if filter instanceof TaskProcessor
        filter._process that, (err) ->
          filter.log.error(err) if err
          cb err
      else if filter instanceof Filter
        Async.eachSeries that.assets, (asset, cb) ->

          if filter.canProcess(asset)

            filter._process asset, (err, result) ->
              if err
                asset.err = err
                filter.log.error "Error", err
                cb err
              else
                cb()
          else
            cb()
        , cb # @asset series
      else
        cb("Unrecognized filter:", filter)
    , (err) -> # pipeline series
      if watch then that._watch()
      cb()


  # Executes this task's environment pipeline.
  #
  execute: (cb) ->
    that = @
    environment = @program.environment
    # Fall back to development if environment is not found
    environment = "development" if !@pipelines[environment]
    pipeObj = @pipelines[environment]

    if !pipeObj
      # Some tasks aggregate dependencies only
      if @dependencies.length > 0
        return cb()
      else
        @log.info "Pipeline not found: #{environment}"
        return cb()

    {pipeline, ran} = pipeObj
    if not @watching and ran
      @log.debug("skipping #{@name}.#{environment}, already ran")
      return cb()

    @log.info "==> #{@name}.#{environment}"
    if typeof pipeline == "function"
      @_executeFunctionTask pipeline, cb
    else
      @_executePipeline pipeline, cb

    pipeObj.ran = true

module.exports = Task
