Runner = require("./runner")
Fs = require("fs")
Path = require("path")
log = require("../common/logger").getLogger("run")
Str = require("underscore.string")

# Loads the project file module.
#
loadProjfile = (projfilePath)->
  throw new Error("Projfile does not exist: #{projfilePath}") unless Fs.existsSync(projfilePath)

  extname = Path.extname(projfilePath)
  if extname == ".coffee"
    try
      require "coffee-script"
    catch ex
      throw new Error("coffee-script could not be loaded, is it installed?")
      process.exit 1

  #projfile = Path.join(Path.dirname(projfilePath), Path.basename(projfile, extname))
  require(projfilePath)


# Loads the project method in the Projfile.
#
# The tasks to execute is performed by `options.executeTask`.
#
# @param {Object} options = {
#   {Object} program Program options.
#   {String} projfilePath The path to Projfile
#   {Function} executeTasks The execute lambda.
# }
_run = (options, executeTasks, cb) ->
  return cb("Options.program is required") unless options.program
  return cb("Options.projfilePath is required") unless options.projfilePath

  {program, projfilePath} = options

  runner = new Runner(program: program)
  projfile = loadProjfile(projfilePath)
  return cb("#{projfilePath} missing `project` function") unless projfile.project

  # Execute the projfile
  if projfile.project.length == 1
    projfile.project runner
    executeTasks runner, projfilePath, cb
  else
    projfile.project runner, (err) ->
      return cb(err) if err
      executeTasks runner, projfilePath, cb


# Runs task
exports.run = (options, cb) ->
  {tasks} = options.program

  executeTasks = (runner, projfilePath, cb) ->
    # Set current working directory to location of projfilePath
    process.chdir Path.dirname(projfilePath)

    # Run the tasks
    runner.executeTasks tasks, cb

  _run options, executeTasks, cb


# Get task descriptions from project file.
#
exports.taskDescriptions = (options, cb) ->
  executeTasks = (runner, projfilePath, cb) ->
    desc = []

    # calc longest name
    L = 0
    for name of runner.tasks
      L = name.length if name.length > L
    for name, task of runner.tasks
      continue if name.indexOf("_") == 0  # underscore tasks are private by convention
      taskDesc = task.description
      desc.push Str.sprintf("    %-#{L}s  #{taskDesc}", name)

    cb null, desc.sort().join("\n")

  _run options, executeTasks, cb


