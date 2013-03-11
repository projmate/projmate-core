program = require("commander")
Pkg = require("../../package.json")
Fs = require("fs")
Logger = require("../lib/common/logger")
Path = require("path")
Runner = require("../lib/pm-build/runner")
Str = require("underscore.string")
Utils = require("../lib/common/utils")
log = Logger.getLogger("pm-build")


# Finds project file from current directory, up.
#
# @returns {*}
#
findProjfile = ->
  files = [program.projfile, "Projfile.js", "Projfile.coffee"]
  for projfile in files
    if projfile
      dir = Utils.findDirUp(projfile)
    return Path.join(dir, projfile) if dir

  if program.projfile
    throw new Error("Projfile not found: #{program.projfile}")
  else
    throw new Error("Projfile not found in #{process.cwd()} or any of its parent directories")
  return null


# Get task descriptions from project file.
#
taskDescriptions = (cb) ->
  try
  # skip first arg which is "build"
    projfile = findProjfile()
    # Create a run environment from Projfile
    runner = new Runner(program: program)

    # Set current working directory to location of projfile
    cwd = process.cwd()
    process.chdir Path.dirname(projfile)
    proj = loadProjfile()

    return cb("#{projfile} missing `project` function") unless proj.project

    executeTasks = (err) ->
      return cb(err) if err
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

    # Executes the projfile async/sync
    if proj.project.length == 1
      proj.project runner
      executeTasks()
    else
      proj.project runner, executeTasks

  catch e
    log.error e


# Loads the project file module.
#
loadProjfile = ->
  projfile = findProjfile()
  return unless projfile

  extname = Path.extname(projfile)
  if extname == ".coffee"
    try
      require "coffee-script"
    catch ex
      throw new Error("coffee-script could not be loaded, is it installed?")
      process.exit 1
  moduleName = Path.join(Path.dirname(projfile), Path.basename(projfile, extname))
  require(moduleName)


# Runs this script
#
run = ->
  try
    tasks = program.args

    projfile = findProjfile()
    log.info "#{program.environment}: #{projfile}"

    # Set current working directory to location of projfile
    cwd = process.cwd()
    process.chdir Path.dirname(projfile)
    proj = loadProjfile()
    throw new Error("#{projfile} does not export `project` function") unless proj.project

    runner = new Runner(program: program)

    executeTasks = (err) ->
      return log.error(err) if err
      # Run the tasks
      runner.executeTasks tasks, (err) ->
        log.error(err) if err

    # Execute the projfile
    if proj.project.length == 1
      proj.project runner
      executeTasks()
    else
      proj.project runner, executeTasks

  catch e
    log.error e


program.on "--help", ->
  taskDescriptions (err, tasks) ->
    if err
      console.error err
    else
      console.log "  Tasks:"
      console.log ""
      console.log tasks

program
  .version(Pkg.version)
  .option("-e, --environment <env>", "Set build environment", "development")
  .option("-f, --projfile <file>", "Set project file", "")
  .option("-w, --watch", "Watch and rerun tasks as needed")
  .option("-s, --serve <dir>", "Runs HTTP/HTTPS server")
  .usage("TASKS [options]")
  .parse(process.argv)

if process.argv.length < 3
  program.outputHelp()
else
  run()
