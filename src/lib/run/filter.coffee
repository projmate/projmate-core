Logger = require("../common/logger")
Util = require("util")
_ = require("lodash")
S = require("string")


# A filter participates with one or more filters, creating a pipeline, through which
# a buffer is transformed by each filter.
#
class Filter

  # Creates an instance of this Filter.
  #
  constructor: (@name, @config={}, @processOptions={}) ->
    @log = Logger.getLogger("F."+@name)
    _.extend @, @config

    if !@extnames
      throw new Error("`extnames` is required for filter #{@name}")
    @extnames = [@extnames] unless Array.isArray(@extnames)


  # Every concrete filter must implement this method.
  #
  process: (asset, options, cb) ->
    throw new Error("`process` must be implemented by filter.")


  # Indicates whether this filter should process the asset. Universal filters
  # should set `extname: "*"`. This is an optimization to minimize invoking
  # a filter unless it can handle the asset's text.
  #
  canProcess: (asset) ->
    return true if @extnames.indexOf("*") >= 0

    # must hanlde cases like ".coffee.md"
    filename = asset.filename
    _.any @extnames, (extname) -> S(filename).endsWith(extname)

  # Filter options may declaritively modify asset properties.
  #
  # @example
  #
  #   f.writeFiles($asset: {filename: {replace: [/^src/, "build"]}}})
  #   f.writeFiles(_filename: {replace: [/^src/, "build"]})
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
      assets = if isAsset then [assetOrTask] else assertOrTask.assets

      for prop, modifiers of $asset
        for asset in assets
          chain = S(asset[prop])
          for fn, args of modifiers
            args = [args] if typeof args == 'string'
            chain = chain[fn].apply(chain, args)
          asset[prop] = chain.s


  # Set defaults in `options` based on the run environment.
  #
  # Filters may preset filter options based on the run environment.
  # As an example, the less compiler should show line numbers
  # in development. See projmate-filters/src/lib/less.coffee
  setRunDefaults: (options) ->
    return unless @environment and @defaults
    env = @environment
    defaults = @defaults

    if env == "development" and defaults.development?
      _.defaults options, defaults.development
    else if env == "test" and defaults.test?
      _.defaults options, defaults.test
    else if env == "production" and defaults.production?
      _.defaults options, defaults.production
    options


  # Wrapped filter's process to pass processOptions
  #
  _process: (assetOrTask, cb) ->
    that = @
    log = @log
    inspect = @processOptions.$inspect
    isAsset = assetOrTask.originalFilename?

    if inspect
      log.debug "Asset BEFORE", "\n"+assetOrTask.toString()

    @checkAssetModifiers assetOrTask

    # Filters may modify processOptions which affects the next filter.
    options = _.clone(@processOptions)
    @setRunDefaults options

    # Filters like `extractMeta` read metadata and assign to __merge for metadata
    # to be merged into options.
    if isAsset and assetOrTask.__merge
      _.extend options, assetOrTask.__merge

    @process assetOrTask, options, (err, result) ->
      # Show filename for troubleshooting
      if err
        if assetOrTask.filename
          log.error "Processing #{assetOrTask.filename} ..."
        return cb(err)

      # Update the asset to reflect the new state, in preparation
      # for the next wrappedFilter.
      if isAsset and typeof result != "undefined"

        # Some filters can return more than one format. For example, Jade can return HTML or JST.
        # Filters can return {text: "filtered text", outExtname: "the new extension"}
        if result.text
          assetOrTask.text = result.text
        else
          assetOrTask.text = result

        if result.outExtName
          assetOrTask.extname = result.outExtname
        else
          assetOrTask.extname = that.outExtname if that.outExtname

      if inspect
        log.debug "Asset AFTER", "\n"+assetOrTask.toString()


      cb null, result

module.exports = Filter
