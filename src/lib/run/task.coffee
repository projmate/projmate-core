_ = require("lodash")
Async = require("async")
Chokidar = require("chokidar")
Filter = require("./filter")
TaskProcessor = require("./taskProcessor")
Util = require("util")
minimatch = require("minimatch")
str = require("underscore.string")
Assets = require("./assets")

blackhole = ->

class Task

  # Creates an instance of this object.
  #
  #
  constructor: (@options) ->
    {log, name, config} = @options
    @name = name
    @normalizeConfig config, (@options.ns || "")
    @program = @options.program

    # init attributes
    @config = config
    @log = log
    @description = config.description
    @dependencies = config.dependencies
    @filters = @options.filters
    @pipelines = {}
    @_initPipelines config


  # Allows short cuts in files
  normalizeConfig: (config, ns) ->

    # Several short cuts to create a file set
    if config.files
      # task:
      #   files: "foo/**/*.ext
      if typeof config.files == "string"
        files = config.files
        config.files =
          include: [files]

      # task:
      #   files: ["foo/**/*.ext]
      if Array.isArray(config.files)
        config.files =
          include: config.files

      # task:
      #   files:
      #     include: "foo/**/*.ext
      if typeof config.files.include == "string"
        config.files.include =  [config.files.include]

      # check for exclusions
      if typeof config.files.exclude == "string"
        config.files.exclude = [config.files.exclude]

      if typeof config.files.watch == "string"
        config.files.watch = [config.files.watch]

      if !Array.isArray(config.files.exclude)
        config.files.exclude =  []

      removePatterns = []
      if Array.isArray(config.files.include)
        for pattern in config.files.include
          if pattern.indexOf("!") == 0
            removePatterns.push pattern
            excludePattern = pattern.slice(1)

            if str.endsWith(excludePattern, '/')
              config.files.exclude.push excludePattern
              config.files.exclude.push excludePattern + "/**/*"
            else
              config.files.exclude.push excludePattern

      # remove exclusions
      config.files.include = _.reject(config.files.include, (pattern) -> removePatterns.indexOf(pattern) >= 0)


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
      # The pipeline can either be an array of filters, OR a function.
      pipeline = config[name]
      continue unless pipeline

      if Array.isArray(pipeline)

        # check if filters disable reading of file contents and storing them into asset.text
        for filter in pipeline
          if !filter
            throw new Error("Undefined filter for #{@name}:#{name}")

          load = !filter.__pragma?.disableLoadFiles
          break if load # get out if ANY need files loading

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

    # TODO find pipeline via hierarchy


  # Watch files in `files.watch` or `files.include` and execute this
  # tasks whenever any matching files changes.
  #
  _watch: (cb) ->
    return if @watching

    @watching = true
    {files} = @config

    # Function-based environment actions have optional files.
    return unless files

    # dir/**/*.ext => match[1] = dirname, match[2] = extname
    subdirRe = /(.*)\/\*\*\/\*(\..*)$/

    # dir/*.ext => match[1] = dirname, match[2] = extname
    dirRe = /(.*)\/\*(\..*)$/

    # Watch patterns can be inferred from `files.include` but in
    # some cases, a single file includes many other files.
    # In this situation, the dependent files should be monitored
    # and declared via `files.watch` to trigger the environment action.
    patterns = if files.watch then files.watch else files.include

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
        console.log "mmpath", path
        console.log "mmpattern", pattern
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
    # functions may take different action based on the run environment
    environment = @program.environment
    fn.environment = environment

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
    environment = @program.environment

    Async.eachSeries pipeline, (wrappedFilter, cb) ->
      if !wrappedFilter
        log.error "PIPELINE", Util.inspect(wrappedFilter)

      # If wrappedFilter is a function then it is still the wrapper function
      # `wrappedFilter.partialProcess`. To unwrap it, call it with no arguments.
      if !wrappedFilter._process
        wrappedFilter = wrappedFilter()

      filter = wrappedFilter
      filter.environment = environment

      if filter instanceof TaskProcessor
        filter._process that, (err) ->
          filter.log.error(err) if err
          return cb err
      else if filter instanceof Filter
        Async.eachSeries that.assets.array(), (asset, cb) ->

          # TODO mysterious issue with undefined asset, print out rest
          # and it might give clue
          if that.assets.detect((asset) -> !asset)
            for asset, i in that.assets.array()
              if asset
                console.log "asset[#{i}].filename=#{asset.filename}"
              else
                console.log "asset[#{i}] is undefined"
          # ENDTODO

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
      console.error(err) if err
      cb(err)


  # Executes this task's environment pipeline.
  #
  execute: (cb) ->
    @assets = new Assets
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
        @log.info "Pipeline not found: #{@name}.#{environment}"
        return cb()

    {pipeline, ran} = pipeObj
    if not @watching and ran
      @log.debug("skipping #{@name}.#{environment}, already ran")
      return cb()

    @log.info "==> #{@name}.#{environment}"
    if typeof pipeline == "function"
      @_executeFunctionTask pipeline, cb
    else if Array.isArray(pipeline)
      @_executePipeline pipeline, cb
    else
      console.debug

    pipeObj.ran = true

module.exports = Task
