exports.server =
  dirname: 'dist'
  httpPort: 1080
  httpsPort: 1443

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
    desc: "Runs tests from src"
    files: "src/test/**/*{Test,Spec}.{coffee,js}"
    dev: [f.mocha]

  distTests:
    desc: "Runs tests from dist"
    files: "dist/test/**/*{Test,Spec}.{coffee,js}"
    dev: [f.mocha]

  dist:
    pre: ["build", "distTests"]

