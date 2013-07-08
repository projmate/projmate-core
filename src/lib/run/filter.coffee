Logger = require("../common/logger")
Util = require("util")
_ = require("lodash")
S = require("string")


# A filter participates with one or more filters, creating a pipeline, through
# which a buffer is transformed in a series. Filters in projmate
# process differ from traditional filters in that they only process assets
# whose registered extension names, `extnames`, match the asset. For example
# a pipeline can contain a `coffee` filter but that filter will only process
# coffee asset and pass through any other asset.
#
class Filter

  # Creates an instance of this Filter.
  #
  constructor: (@name, @config={}, @processOptions={}) ->
    @log = Logger.getLogger("F."+@name)
    _.extend @, @config

    # Allows a function shortcut for command attribute. Used by functoid
    #
    # The anonymous function `(asset) ->` results in `processOptions = {command: (asset) ->}
    if _.isFunction(@processOptions)
      @processOptions =
        command: @processOptions



  # Every concrete filter must implement this method.
  #
  process: (asset, options, cb) ->
    throw new Error("`process` must be implemented by filter.")


  # Indicates whether this filter should process the asset. Universal filters
  # should set `extname: "*"`. This is an optimization to minimize invoking
  # a filter unless it can handle the asset's text.
  #
  canProcess: (asset) ->

    # Simple if expression on the filter
    #
    # f.addHeader(text: "...", $if: {extname: ".txt"})
    if @processOptions.$if
      truthy = true
      for prop, comparison of @processOptions.$if
        value = asset[prop]
        if _.isString(comparison)
          truthy &&= asset[prop] == comparison
        else if val instanceof RegExp
          truthy &&= comparison.test(value)
        else if typeof val == "boolean"
          truthy &&= val
        else
          @log.warn "Unrecognized $if asset property: '#{prop}'"
          truthy = false
        return false unless truthy
      return truthy


    return true if @extnames.indexOf("*") >= 0

    # must hanlde cases like ".coffee.md"
    filename = asset.filename
    result = _.any(@extnames, (extname) -> S(filename).endsWith(extname))
    if !result
      @log.debug "Ignoring extname #{filename}"
    result

  # Filter options may declaritively modify asset properties.
  #
  # @example
  #
  #   f.writeFile($asset: {filename: {replace: [/^src/, "build"]}}})
  #   f.writeFile(_filename: {replace: [/^src/, "build"]})
  #
  # Both convert the filename from `src` to the `build` directory.
  #
  checkAssetModifiers: (assetOrTask) ->

    $asset = @processOptions.$asset

    # Normalize short form `_filename` -> `$asset: filename`
    for reserved in ["_filename"]
      if @processOptions[reserved]
        $asset ?= {}
        $asset[reserved.slice(1)] = @processOptions[reserved]

    if $asset
      isAsset = assetOrTask.originalFilename?
      assets = if isAsset then [assetOrTask] else assertOrTask.assets.array()

      for prop, modifiers of $asset
        for asset in assets

          # _filename: 'foo.html'
          if typeof modifiers == "string"
            asset[prop] = modifiers
          else
            chain = S(asset[prop])
            for fn, args of modifiers
              args = [args] if typeof args == "string"
              chain = chain[fn].apply(chain, args)
            asset[prop] = chain.s


  # Set defaults in `options` based on the run environment.
  #
  # Filters may preset filter options based on the run environment.
  # As an example, the less compiler should show line numbers
  # in development. See projmate-filters/src/lib/less.coffee
  setRunDefaults: (options) ->
    return unless @environment
    env = @environment
    defaults = @defaults

    if env == "development"
      options.DEVELOPMENT = true
      if defaults?.development?
        _.defaults options, defaults.development
    else if env == "test"
      options.TEST = true
      if  defaults?.test?
        _.defaults options, defaults.test
    else if env == "production"
      options.PRODUCTION = true
      if defaults?.production?
        _.defaults options, defaults.production
    options


  # Wrapped filter's process to pass processOptions
  #
  _process: (assetOrTask, cb) ->
    _this = @

    log = @log
    inspect = @processOptions.$inspect
    isAsset = assetOrTask.originalFilename?

    if inspect
      log.debug "Asset BEFORE", "\n"+assetOrTask.toString()
    @checkAssetModifiers assetOrTask

    # Filters may modify processOptions which affects the next filter.
    options = _.clone(@processOptions)
    @setRunDefaults options

    # Filters like `extractMeta` read metadata and set properties on asset.
    # asset.__filterOptions merges or extends options
    # asset.__meta defines a new property for asset
    if isAsset
      if assetOrTask.__merge
        _.extend options, assetOrTask.__filterOptions
      else if assetOrTask.__meta
        options[__meta.name] = __meta.meta

    processed = (err, result) ->
      # Show filename for troubleshooting
      if err
        if assetOrTask.filename
          log.error ">> #{assetOrTask.filename}"
        return cb(err)

      # Update the asset to reflect the new state, in preparation
      # for the next wrappedFilter.
      if isAsset and result?

        # Some filters can return more than one format. For example, Jade can return HTML or JST.
        # Filters can return {text: "filtered text", extname: "the new extension"}
        if result.text
          assetOrTask.text = result.text
        else
          assetOrTask.text = result

        if result.extname
          assetOrTask.extname = result.extname
        else
          assetOrTask.extname = _this.outExtname if _this.outExtname

      if inspect
        log.debug "Asset AFTER", "\n"+assetOrTask.toString()
      cb null, result

    try
      @process assetOrTask, options, processed
    catch ex
      console.error "CAUGHT #{assetOrTask.filename}"
      cb ex



module.exports = Filter
