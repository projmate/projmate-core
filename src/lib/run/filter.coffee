Logger = require("../common/logger")
Util = require("util")
_ = require("lodash")
S = require("string")


##
# A filter participates with one or more filters, creating a pipeline, through which
# a buffer is transformed by each filter.
#
class Filter

  ##
  # Creates an instance of this Filter.
  #
  constructor: (@name, @config={}, @processOptions={}) ->
    @log = Logger.getLogger("Filter."+@name)
    _.extend @, @config

    if !@extnames
      throw new Error("`extnames` is required for filter #{@name}")
    @extnames = [@extnames] unless Array.isArray(@extnames)


  ##
  # Every concrete filter must implement this method.
  #
  process: (asset, options, cb) ->
    throw new Error("`process` must be implemented by filter.")


  ##
  # Indicates whether this filter should process the asset. Universal filters
  # should set `extname: "*"`. This is an optimization to minimize invoking
  # a filter unless it can handle the asset's text.
  #
  canProcess: (asset) ->
    return @extnames.indexOf("*") >= 0 or @extnames.indexOf(asset.extname) >= 0

  # Filter properties may declaritively modify asset properties.
  #
  # As an example,
  #
  #   f.writeFiles($asset: {filename: { chompLeft: 'src', prepend: 'build' }}})
  #
  # Means, convert the filename from `src` to the `build` directory.
  #
  # In code: S(asset.filename).chompLeft('src').prepend('build').
  checkAssetModifiers: (assetOrTask) ->
    $asset = @processOptions.$asset
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

  ##
  # Wrapped filter's process to pass processOptions
  #
  _process: (assetOrTask, cb) ->
    that = @
    log = @log
    inspect = @processOptions.$inspect

    if inspect
      log.debug "Asset BEFORE", "\n"+assetOrTask.toString()

    @checkAssetModifiers assetOrTask

    # some filters modify processOptions which affects the next invocation, clone to start fresh
    @process assetOrTask, _.clone(@processOptions), (err, result) ->

      # Show filename for troubleshooting
      if err and assetOrTask.filename
        log.error "Processing #{assetOrTask.filename} ..."
        return cb(err)

      isAsset = assetOrTask.originalFilename?

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
