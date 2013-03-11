sh = require("projmate-shell")

task "build", "Builds the project.", ->
  sh.rm "-rf", "dist"
  sh.coffee "-c -o dist src", (err) ->
    sh.cp "-f", "src/lib/common/coffeeFill.js", "dist/lib/common"
    # copy certs
    sh.cp "-f", "src/lib/pm-serve/local*", "dist/lib/pm-serve"
