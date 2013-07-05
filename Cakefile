$ = require("projmate-shell")

task "build", "Builds the project.", ->
  $.rm "-rf", "dist"
  $.mkdir "-p", "dist/lib/serve"
  $.coffee "-c -o dist src", (err) ->
    $.cp "-rf", "src/lib/common/*.js", "dist/lib/common"
    $.cp "-rf", "src/lib/common/appenders", "dist/lib/common"
    # copy certs
    $.cp "-f", "src/lib/serve/local*", "dist/lib/serve"
    $.cp_rf "src/lib/serve/js", "dist/lib/serve"


task "test", ->
  $.run "mocha --compilers coffee:coffee-script src/test"
