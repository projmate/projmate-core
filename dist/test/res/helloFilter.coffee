module.exports = (Projmate) ->
  schema =
    title: 'Hello filter'
    type: 'object'
    __:
      extnames: '*'

  class Hello extends Projmate.Filter
    @schema: schema

    process: (asset, options, cb) ->
      cb null, 'Hello ' + asset.text


