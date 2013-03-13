exports.server =
  dirname: 'dist'
  httpPort: 8000 #80
  httpsPort: 8443

exports.project = (pm) ->
  f = pm.filters()
  $ = pm.shell()

  # Changes the filename of an asset.
  #   "src/foo/index.js" =>  "dest/foo/index.js"
  setDestination =
    filename:
      replace: [/^src/, "dist"]

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
        f.writeFiles($asset: setDestination)
      ]

