module.exports = (Projmate) ->
  schema =
    title: 'Aloha filter'
    type: 'object'
    __:
      extnames: '*'

  class Aloha extends Projmate.Filter
    @schema: schema

    process: (asset, options, cb) ->
      cb null, 'Aloha ' + asset.text

