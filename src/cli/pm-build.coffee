Fs = require("fs")
Logger = require("../lib/common/logger")
PackageJson = require("../../package.json")
Path = require("path")
Program = require("commander")
Runner = require("../lib/pm-build/runner")
Str = require("underscore.string")
Utils = require("../lib/common/utils")

log = Logger.getLogger("pm-build")
version = PackageJson.version


# Parse options
Program
  .version(version)
  .option("-e, --environment [env]", "Set build environment", "development")
  .option("-f, --projfile [file]", "Set project file", "")
  .option("-w, --watch", "Watch and rerun tasks as needed")
  .option("-s, --serve [dir]", "Runs HTTP/HTTPS server")
  .parse(process.argv)


# Finds project file from current directory, up.
#
# @returns {*}
#
findProjfile = ->
  files = [Program.projfile, "Projfile.js", "Projfile.coffee"]
  for projfile in files
    if projfile
      dir = Utils.findDirUp(projfile)
    return Path.join(dir, projfile) if dir

  if Program.projfile
    throw new Error("Projfile not found: #{Program.projfile}")
  else
    throw new Error("Projfile not found in #{process.cwd()} or any of its parent directories")
  return null

taskDescriptions = (cb) ->
  try
  # skip first arg which is "build"
    projfile = findProjfile()
    # Create a run environment from Projfile
    runner = new Runner()
    runner.program = Program

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
        desc.push Str.sprintf("  %-#{L}s  #{taskDesc}", name)
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
exports.run = ->
  try
    # Skips "build"
    tasks = Program.args.slice(1)

    projfile = findProjfile()
    log.info "#{Program.environment}: #{projfile}"

    # Set current working directory to location of projfile
    cwd = process.cwd()
    process.chdir Path.dirname(projfile)
    proj = loadProjfile()
    throw new Error("#{projfile} does not export `project` function") unless proj.project

    runner = new Runner(program: Program)

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


# Returns metadata.
#
exports.meta =
  name: "build"

  description: "Builds a project"

  quickUsage: -> """
#{taskDescriptions()}
"""

  usage: (cb) ->
    taskDescriptions (err, descriptions) ->
      return cb(err) if err

      cb """
        Builds environment tasks in Projfile (v#{version})

        Usage: pm build TASKS OPTIONS

        TASKS
        #{descriptions}

        OPTIONS
          -e, --environment=ENV_NAME  Build environment, default 'development'
          -f, --projfile=PROJFILE     Custom project file
          -w, --watch                 Watch and rebuild tasks as needed
          -s, --serve=DIR            Runs HTTP/HTTPS server
        """
