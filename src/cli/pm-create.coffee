Fs = require("fs")
Logger = require("../lib/common/logger")
Path = require("path")
Program = require("commander")
Runner = require("../lib/pm-build/runner")
log = Logger.getLogger("pm-create")
pkg = require("../../package.json")
version = pkg.version

Program
  .version(version)
  .parse(process.argv)




##
# Runs this script
#
exports.run = ->
  try
    # skip first arg which is "create"
    tasks = Program.args.slice(1)
    projfile = findProjfile()
    log.debug """
              environment=#{Program.environment}
              projfile=#{projfile}
              """

    # Create a run environment from Projfile
    runner = new Runner()
    runner.program = Program

    # Set current working directory to location of projfile
    cwd = process.cwd()
    process.chdir Path.dirname(projfile)
    proj = loadProjfile()

    throw new Error("#{projfile} does not export `project` function") unless proj.project

    executeTasks = (err) ->
      return log.error(err) if err
      # Run the tasks
      runner.executeTasks tasks, (err) ->
        log.error(err) if err

    # call the exported `project` method in projfile
    if proj.project.length == 1
      proj.project runner
      executeTasks()
    else
      proj.project runner, executeTasks

  catch e
    log.error e


##
# Metadata about this script
#
exports.meta =
  name: "gen"
  description: "Generates a project from git repository."
  quickUsage: -> """
  #{taskDescriptions()}
                 """

  usage: -> """
    gen - Generates a project from a git repository.

    Usage: pm gen OPTIONS GITURL
  """
