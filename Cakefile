$ = require("projmate-shell")

task "build", "Builds the project.", ->
  $.rm "-rf", "dist"
  $.coffee "-c -o dist src", (err) ->
    $.cp "-f", "src/lib/common/coffeeFill.js", "dist/lib/common"
    # copy certs
    $.cp "-f", "src/lib/pm-serve/local*", "dist/lib/pm-serve"

task "test", ->
  $.run "mocha --compilers coffee:coffee-script src/test"
