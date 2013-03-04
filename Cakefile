sh = require("sex")

task "build", "Builds the project.", ->
  sh.run "./node_modules/.bin/coffee", ["-c", "-o", "dist", "src"], (err) ->
    sh.cp "-f", "src/lib/common/coffeeFill.js", "dist/lib/common"
