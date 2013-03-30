Runner = require("./runner")
Fs = require("fs")
Path = require("path")
log = require("../common/logger").getLogger("run")
Str = require("underscore.string")
Server = require("../serve/server")

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

  projfile = loadProjfile(projfilePath)
  return cb("#{projfilePath} missing `project` function") unless projfile.project

  runner = new Runner(program: program, server: projfile.server)
  runner.load projfile, {ns: '', cwd: process.cwd()}, (err) ->
    return cb(err) if err

    executeTasks {runner, projfile, projfilePath}, cb


# Runs task
#
exports.run = (options, cb) ->
  startTime = Date.now()

  program = options.program
  {tasks} = program
  pjfile = null

  executeTasks = (args, cb) ->
    {runner, projfile, projfilePath} = args
    pjfile = projfile

    # Set current working directory to location of projfilePath
    process.chdir Path.dirname(projfilePath)

    # Run the tasks
    runner.executeTasks tasks, cb

  _run options, executeTasks, (err) ->
    return cb(err) if err

    serve = program.serve
    serverConfig = pjfile.server
    if serve
      dirname = serve
      if dirname.length > 0
        serveOptions = {dirname}
      else if serverConfig
        serveOptions = serverConfig
      else
        serveOptions = dirname: "."

      Server.run serveOptions
    else if !program.watch
      endTime = Date.now()
      elapsed = endTime - startTime
      log.info("OK - #{elapsed/1000} seconds")
      cb()


# Get task descriptions from project file.
#
exports.taskDescriptions = (options, cb) ->
  executeTasks = (args, cb) ->
    {runner, projfile, projfilePath} = args
    desc = []

    # calc longest name
    L = 0
    for name of runner._tasks
      L = name.length if name.length > L
    for name, task of runner._tasks
      continue if name.indexOf("_") == 0  # underscore tasks are private by convention
      taskDesc = task.description
      desc.push Str.sprintf("    %-#{L}s  #{taskDesc}", name)

    cb null, desc.sort().join("\n")

  _run options, executeTasks, cb

