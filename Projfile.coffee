exports.server =
  directory: 'dist'
  http: 80
  https: 443
  domain: 'dev.projmate.com'

exports.project = (pm) ->
  f = pm.filters()
  $ = pm.shell()

  pm.registerTasks
    source:
      _desc: "Compiles source files"
      _files:
        include: [
          "src/**/*"
        ]

      development: [
        f.coffee(bare: true)
        # TODO add append/prepend to string.js.
        f.addHeader(filename: "doc/copyright.js")
        f.writeFiles(_filename: {chompLeft: "src", ensureLeft: "dist"})
      ]

