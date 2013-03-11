exports.server =
  directory: 'dist'
  http: 80
  https: 443
  domain: 'dev.projmate.com'


exports.project = (pm) ->
  f = pm.filters()
  sh = pm.shell()


  writeToCurrentDir = f.writeFile(lchomp: "src", destinationDir: ".")

  addHeader = f.functoid(name: "foo", process: (asset, options) ->
    """
    /**
     *
     * Copyright (c) 2013, Mario L Gutierrez
     */
    #{asset.text}
    """
  )


  pm.registerTasks
    scripts:
      _description: "Builds scripts"
      _files:
        include: ["src/**/*.coffee", "src/**/*.js"]

      development: [
        f.coffee(bare: true)
        writeToCurrentDir
      ]

      production: [
        f.coffee
        addHeader
        writeToCurrentDir
      ]

    clean:
      development: ->
        sh.rm "-rf", "lib"
        sh.rm "-rf", "test"
        sh.rm "-f", "index.js"

    res:
      _pre: ["clean"]

      development: ->
        sh.mkdir "-p", "test/res"
        sh.cp "-rf", "src/test/res/*", "test/res"
