module.exports = (Projmate) ->

  schema =
    title: 'Aloha filter'
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
  class Aloha extends Projmate.Filter
    @schema: schema

    process: (asset, options, cb) ->
      cb null, 'Aloha ' + asset.text


