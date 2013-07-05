Path = require("path")
Fs = require("fs")

###
# Finds project file.
#
# @returns Returns the full path to found projec file.
###
exports.findProjfile = (program) ->
  files = [program.projfile, "Projfile.js", "Projfile.coffee"]
  for file in files
    continue unless file?.length > 0
    projfile = Path.resolve(file)
    return projfile if Fs.existsSync(projfile)

  if program.projfile
    throw new Error("Projfile not found: #{program.projfile}")
  else
    throw new Error("Projfile not found in #{process.cwd()} or any of its parent directories")
  return null

