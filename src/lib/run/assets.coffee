FileAsset = require("./fileAsset")
_ = require("lodash")


cid = 1

class Assets
  constructor: ->
    @_assets = []

  array: ->
    @_assets

  push: (asset) ->
    asset.cid = cid++
    @_assets.push asset

  pop: ->
    @_assets.pop()

  at: (index) ->
    @_assets[index]

  remove: (asset) ->
    idx = this.indexOf (asst) -> asst.cid == asset.cid
    @_assets.splice(idx, 1) if idx > -1
    @_assets

  # Remove items from the array.
  #
  removeAssets: (lambda) ->
    l = @_assets.length
    while l--
      @_assets.splice(l, 1) if lambda(@_assets[l])

  reset: (newAssets) ->
    @_assets = newAssets

  create: (opts) ->

    asset = new FileAsset
      filename: opts.filename
      text: opts.text
      cwd: opts.cwd
      parent: this
      stat: opts.stat
    asset.cid = 'c' +cid
    _.defaults asset, opts

    cid += 1
    @_assets.push asset
    # if asset.extname == '.map'
    #   console.log 'map asset', asset
    asset


  clear: ->
    @_assets.length = 0


# mixin lodash methods
methods = [
  'forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
  'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
  'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
  'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
  'tail', 'drop', 'last', 'without', 'indexOf', 'shuffle', 'lastIndexOf',
  'isEmpty', 'pluck'
]

methods.forEach (method) ->
  Assets.prototype[method] = (args...) ->
    args.unshift this._assets
    _[method].apply _, args


module.exports = Assets
