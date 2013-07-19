module.exports = (Projmate) ->

  schema =
    title: 'Hello filter'
    type: 'object'
    __:
      extnames: '*'


  # Difference between tap and Functoid is that doesn't return a value so
  # it does not change asset as a result of sync function.
  #
  # @example
  #
  # replaceVersion = f.functoid process: (asset, options) ->
  #   asset.text = asset.text.replace /VERSION/g, "1.0.1"
  class Hello extends Projmate.Filter
    @schema: schema

    process: (asset, options, cb) ->
      cb null, 'Hello ' + asset.text


