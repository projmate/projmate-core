exports.server =
  dirname: 'dist'
  httpPort: 8000 #80
  httpsPort: 8443

exports.project = (pm) ->
  f = pm.filters()
  $ = pm.shell()

  #  "src/**/*" => "dist/**/*"
  distDir = _filename: { replace: [/^src/, "dist"] }

  build:
    pre: "clean"
    files: "src/**/*"

    development: [
      f.coffee(bare: true)
      f.addHeader(filename: "doc/copyright.js")
      f.writeFile(distDir)
    ]

  clean:
    development: ->
      $.rm_rf "dist"

  tests:
    development: (cb) ->
      $.run "mocha -R spec --compilers coffee:coffee-script --globals PROJMATE src/test", cb


  dist:
    pre: ["build", "tests"]



