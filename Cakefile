sh = require("projmate-shell")

task "build", "Builds the project.", ->
  sh.coffee "-c -o dist src", (err) ->
    sh.cp "-f", "src/lib/common/coffeeFill.js", "dist/lib/common"
    sh.cp "-f", "src/lib/pm-build/server/local*", "dist/lib/pm-build/server"
