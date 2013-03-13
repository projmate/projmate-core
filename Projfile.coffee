exports.server =
  dirname: 'dist'
  httpPort: 8000 #80
  httpsPort: 8443

exports.project = (pm) ->
  f = pm.filters()
  $ = pm.shell()

  #  "src/**/*" => "dist/**/*"
  toDist = filename: { replace: [/^src/, "dist"] }

  pm.registerTasks
    build:
      _files:
        include: [
          "src/**/*"
        ]

      development: [
        f.coffee(bare: true)
        f.addHeader(filename: "doc/copyright.js")
        f.writeFiles($asset: toDist)
      ]

