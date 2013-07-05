_ = require("lodash")
Async = require("async")
Chokidar = require("chokidar")
Filter = require("./filter")
TaskProcessor = require("./taskProcessor")
Util = require("util")
minimatch = require("minimatch")
str = require("underscore.string")
Assets = require("./assets")
Utils = require('../common/utils')

blackhole = ->

class Task

  # Creates an instance of this object.
  #
  #
  constructor: (@options) ->
    {cwd, log, name, config} = @options
    @name = name
    config = @normalizeConfig(config, @options.ns)
    @program = @options.program

    # init attributes
    @config = config
    @log = log
    @description = config.description
    @dependencies = config.dependencies
    @filters = @options.filters
    @pipelines = {}
    @_initPipelines config
    @cwd = cwd


  # Allows short cuts in files
  normalizeConfig: (config, ns="") ->

    # A task can just be dependencies
    if Array.isArray(config)
      config = pre: config

    if typeof config is "function"
      config =
        development: config

    if typeof config is "string"
      config = pre: [config]


    Utils.normalizeFiles config, 'files'
    Utils.normalizeFiles config, 'watch'

    config.description = config.desc || config.description || "Runs #{@name} task"
    config.dependencies = config.pre || config.deps || config.dependencies || []
    config.dependencies = [config.dependencies] if typeof config.dependencies == "string"

    # shorter aliases
    config.development ?= config.dev
    config.production ?= config.prod

    # Tasks in a namespace will not be located unless they're all within
    # the same namespace
    if ns.length > 0
      for dep, i in config.dependencies
        config.dependencies[i] = ns+":"+dep

    # TODO: configurable highest to lowest priority
    unless config.environments
      config.environments = ["production", "test", "development"]
    config


  # Normalizes pipeline as a series of filters, prepending `loadFiles` to
  # the pipeline (if needed) to kick things off.
  #
  _initPipelines: (config) ->
    for name in config.environments
      # The pipeline can either be an array of filters, OR a function which
      # returns an array of filters.
      #
      # A custom function is specified by development.command
      pipeline = config[name]
      continue unless pipeline

      if Array.isArray(pipeline)

        # Allow sub pipelines
        pipeline = _.flatten(pipeline)


        # A pipeline can be a factory or a filter (created by executing factory)
        # Important schema properties are assigned to the instance when created
        # so we can treat the filter itself as a schema
        filter = pipeline[0]
        if filter._process
          schema = filter
        else
          schema = filter.schema

        # Each pipeline needs to load assets. Determine if the first filter
        # has a specific loader or is an assetLoader. If a loader is not found
        # then default to `loadFiles`
        alternateLoader = filter.useLoader
        if alternateLoader
          pipeline.unshift @filters[alternateLoader]
        else if !filter.isAssetLoader?
          pipeline.unshift @filters.loadFiles

        # sanity check
        for filter, i in pipeline
          if typeof filter == 'undefined'
            throw new Error("Undefined filter at #{@name}:#{name}[#{i}]")
          unless typeof filter == "function" or filter instanceof Filter
            throw new Error("Invalid filter at #{@name}:#{name}[#{i}]")

      else if typeof pipeline isnt 'function'
        throw new Error("Pipeline is neither [filters] or function: #{@name}:#{name}")

      @pipelines[name] = { pipeline, ran: false }



  # Watch files in `files.watch` or `files.include` and execute this
  # tasks whenever any matching files changes.
  #
  _watch: (cb) ->
    return if @watching

    @watching = true
    {files, watch} = @config

    # Function-based environment actions have optional files.
    return unless files or watch

    # dir/**/*.ext => match[1] = dirname, match[2] = extname
    subdirRe = /(.*)\/\*\*\/\*(\..*)$/

    # dir/*.ext => match[1] = dirname, match[2] = extname
    dirRe = /(.*)\/\*(\..*)$/

    # Watch patterns can be inferred from `files.include` but in
    # some cases, a single file includes many other files.
    # In this situation, the dependent files should be monitored
    # and declared via `files.watch` to trigger the environment action.
    patterns = if watch?.include? then watch.include else files.include

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
    watcher.on "change", _.debounce ((path) -> checkExecute("changed", path)), 1250
    # watcher.on 'unlink', (path) -> log.debug "`#{path}` removed"
    # watcher.on 'error', (path) -> log.debug "`#{path}` errored"
    #
    @log.info "Watching #{paths.join(', ')}"


  _executeFunctionTask: (fn, cb) ->
    that = @
    watch = @program.watch
    # functions may take different action based on the run environment
    environment = @program.environment
    fn.environment = environment

    if fn.length == 1
      timeoutId = null

      env = {environment, timeout: 2000}
      fn.call env, (err) ->
        # timeout may have expired, which sets cb to null
        if cb
          clearTimeout timeoutId
          return cb(err) if err
          if watch then that._watch()
          cb()

      timeout = env.timeout
      timeoutId = setTimeout ->
        clearTimeout timeoutId
        cb('Execution exceeded ' + timeout + 'ms. Check callback was called or set `this.timeout = ms` to increase allowed time')
        cb = null
      , timeout
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
    environment = @program.environment

    Async.eachSeries pipeline, (wrappedFilter, cb) ->
      if !wrappedFilter
        log.error "PIPELINE", wrappedFilter

      # If wrappedFilter is a function then it is still the wrapper function
      # `wrappedFilter.partialProcess`. To unwrap it, call it with no arguments.
      if !wrappedFilter._process
        wrappedFilter = wrappedFilter()

      filter = wrappedFilter
      filter.environment = environment

      if filter instanceof TaskProcessor
        filter._process that, (err) ->
          return cb(err)
      else if filter instanceof Filter
        Async.eachSeries that.assets.array(), (asset, cb) ->

          # TODO mysterious issue with undefined asset, print out rest
          # and it might give clue
          if that.assets.detect((asset) -> !asset)
            for asset, i in that.assets.array()
              if asset
                log.debug "asset[#{i}].filename=#{asset.filename}"
              else
                log.debug "asset[#{i}] is undefined"
          # ENDTODO

          if filter.canProcess(asset)
            filter._process asset, (err, result) ->
              if err
                asset.err = err
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
      cb err


  # Executes this task's environment pipeline.
  #
  execute: (cb) ->
    @assets = new Assets
    that = @
    if @cwd and process.cwd() != @cwd
      @log.debug 'Changing to task\'s work directory: ' +  @cwd
      process.chdir @cwd

    environment = @program.environment
    # Fall back to development if environment is not found
    environment = "development" if !@pipelines[environment]
    pipeObj = @pipelines[environment]

    if !pipeObj
      # Some tasks aggregate dependencies only
      if @dependencies.length > 0
        return cb()
      else
        @log.info "Pipeline not found: #{@name}.#{environment}"
        return cb()

    {pipeline, ran} = pipeObj
    if not @watching and ran
      @log.debug("skipping #{@name}.#{environment}, already ran")
      return cb()

    @log.debug "==> #{@name}.#{environment}"
    if typeof pipeline == "function"
      @_executeFunctionTask pipeline, (err) ->
        pipeObj.ran = !err
        cb err

    else if Array.isArray(pipeline)
      @_executePipeline pipeline, (err) ->
        pipeObj.ran = !err
        cb err
    else
      cb 'unrecognized pipeline: ' + typeof(pipeline)


module.exports = Task
