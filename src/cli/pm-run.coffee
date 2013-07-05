Program = require("commander")
Pkg = require("../../package.json")
Fs = require("fs")
Logger = require("../lib/common/logger")
Path = require("path")
Run = require("../lib/run")
Utils = require("../lib/common/utils")
log = Logger.getLogger("pm-run")
$ = require('projmate-shell')
Helpers = require('./helpers')

process.on 'SIGINT', ->
  $.killAll()
  process.reallyExit()


# Runs this script
#
run = ->
  try
    Program.tasks = Program.args
    projfilePath = Helpers.findProjfile(Program)

    # Most users will use dev, test, release environments.
    # The custom `-e` environment flag is for custom environments.
    unless Program.environment
      Program.environment = "development" if Program.dev
      Program.environment = "test" if Program.test
      Program.environment = "production" if Program.prod
      Program.environment = "production" if Program.release
      # still no environment? default to development
      Program.environment ?= "development"

    log.info "env: #{Program.environment} file: #{Utils.relativeToCwd(projfilePath)}"

    Run.run {program: Program, projfilePath: projfilePath}, (err) ->
      if err
        log.error(err) if err != "PM_SILENT"
      unless $.hasChildProcesses()
        process.exit()
  catch e
    log.error e

# Gets task descriptions from project file
#
taskDescriptions = (cb) ->
  try
    projfilePath = Helpers.findProjfile(Program)
    Run.taskDescriptions {program: Program, projfilePath: projfilePath}, cb
  catch e
    log.error e


Program.on "--help", ->
  taskDescriptions (err, tasks) ->
    if err
      log.error err
    else
      console.log "  Tasks:"
      console.log ""
      console.log tasks

Program
  .version(Pkg.version)
  .option("-e, --environment <env>", "Set build environment", "development")
  #.option("--dev", "Set development mode. Default")
  #.option("--test", "Set test mode")
  #.option("--prod", "Set production mode")
  #.option("--release", "Set release (production) mode")
  .option("-f, --projfile <file>", "Set project file", "")
  .option("-w, --watch", "Watch and rerun tasks as needed")
  .option("-s, --serve [dir]", "Runs HTTP/HTTPS server")
  .usage("TASKS [options]")
  .parse(process.argv)

Program._name = 'pm run'

if process.argv.length < 3
  Program.outputHelp()
else
  run()
