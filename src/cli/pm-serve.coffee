Fs = require("fs")
Logger = require("../../dist/lib/common/logger")
PackageJson = require("../../package.json")
Path = require("path")
Program = require("commander")
Runner = require("../../dist/lib/pm-serve/runner")
Str = require("underscore.string")

log = Logger.getLogger("pm-serve")
version = PackageJson.version

Program
  .version(version)
  .option("-p, --port [PORT]", "HTTP port", 8000)
  .option("-s, --ssl-port [HTTPS_PORT]", "HTTPS port", 4430)
  .parse(process.argv)


# Runs this script
#
exports.run = ->
  try
    # skips "serve"
    tasks = Program.args.slice(1)

    projfile = findProjfile()
    log.debug """
              .
                environment: #{Program.environment}
                projfile: #{projfile}
              """
    # Create a run environment from Projfile
    runner = new Runner(program: Program)

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


# Metadata about this script
#
exports.meta =
  name: "serve"
  description: "Runs HTTP/HTTPS Server from Directory"
  quickUsage: -> """
    To serve current directory
      pm serve

    Browse
      http://localhost:8000
      https://localhost:4430
    """

  usage: (cb) ->
    cb """
      #{exports.meta.description} (v#{version})

      Usage: pm serve [DIR=.] [OPTIONS]

      OPTIONS
        -p, --port=8000     HTTP port.
        -s, --ssl-port=4430 HTTPS port.
        -k, --known-ports   Serve on known ports 80 and 443.

      EXAMPLES

      Serve current directory using HTTP:8000 and HTTPS:4430 defaults
        pm serve

      Serve `dist` directory on port 80 and port 443
        sudo pm serve dist -k
      """
