exports.server =
  httpPort: 1080
  httpsPort: 1443
  directory: "build"

exports.project = (pm) ->
  f = pm.filters()
  $ = pm.shell()

  pm.regiserTasks
    appjs:
      desc: "Builds {{pm__project}}'s browser-side CommonJS module app"
      development: ->

    clean:
      desc: "Cleans this project"
      development: ->
        $.rm_rf "build"
















