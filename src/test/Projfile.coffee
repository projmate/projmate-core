exports.project = (pm) ->
  f = pm.filters()
  sh = pm.shell()
  writeToBuildDir = f.writeFile(lchomp: "test/res", destinationDir: "test/build")

  addHeader = f.functoid(name: "foo", process: (asset, options) ->
    """
    // Copyright #{options.name}
    #{asset.text}
    """
  )

  pm.registerTasks
    stylesheets:
      _pre: ["res"]

      _files:
        include: ["test/res/test.less"]

      development: [
        f.less(dumpLineNumbers: "comments")
        writeToBuildDir
      ]

      production: [
        f.less
        writeToBuildDir
      ]


    scripts:
      _pre: ["res"]

      _files:
        include: ["test/res/foo_js/**/*.coffee", "test/res/foo_js/**/*.js"]

      development: [
        f.coffee
        # since writeToBuildDir chomps "test/res", this will get written to "test/build/myapp.js"
        f.commonJsify(baseDir: "test/res/foo_js", moduleName: "myapp", filename: "test/res/myapp.js")
        addHeader
        writeToBuildDir
      ]


    clean:
      development: ->
        sh.rm "-rf", "test/build"
        sh.rm "-rf", "test/res"

    res:
      _pre: ["clean"]

      development: ->
        sh.mkdir "-p", "test/res"
        sh.cp "-rf", "src/test/res/*", "test/res"

