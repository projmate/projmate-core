Program = require("commander")
Pkg = require("../../package.json")
Fs = require("fs")
Logger = require("../lib/common/logger")
Path = require("path")
Run = require("../lib/run")
Utils = require("../lib/common/utils")
log = Logger.getLogger("pm-meta")
$ = require("projmate-shell")
Helpers = require("./helpers")
Str = require("underscore.string")
Colors = require('mgutz-colors')
_ = require("lodash")

Runner = require("../lib/run/runner")

blue = Colors.fn('blue+h')
green = Colors.fn('green+h')
magenta = Colors.fn('magenta+h')

runProject = (project, cb) ->
  program = {}
  runner = new Runner({program})
  runner.load project, {cwd: __dirname}, (err) ->
    console.error(err) if err
    cb()

process.on "SIGINT", ->
  $.killAll()
  process.reallyExit()


printProperties = (names, properties, options) ->
  # calc longest property name
  L = options.longestName

  descriptions = []
  for name in names.sort()
    o = properties[name]
    descriptions.push "  " + green(Str.pad(name + ':', L+1, ' ', 'right')) + Str.sprintf(" %-9s %s", "{"+o.type+"}", o.description)
  console.log descriptions.join("\n")

printExamples = (schema) ->
  examples = schema._examples
  return unless examples

  console.log "\nEXAMPLES"
  first = true
  for example in examples
    if !first
      console.log "\n"
    first = false
    console.log "  * " + example.title + "\n"
    for line in Str.lines(example.text)
      console.log "    " + line


prettyPrint = (filterName, Filter, options) ->
  properties = []

  console.log ""
  if Filter.schema

    # calc longest property name
    L = 0
    for name of Filter.schema.properties
      L = name.length if name.length > L


    console.log "FILTER"
    console.log "  #{blue(filterName)} - #{Filter.schema.title}"
    console.log ""

    if options.json
      console.log JSON.stringify(Filter.schema, null, "  ")
    else
      keys = _(Filter.schema.properties).keys().sort().value()

      if Filter.schema.required
        console.log "REQUIRED"
        printProperties Filter.schema.required, Filter.schema.properties, longestName: L
        console.log ""
        keys = _.difference(keys, Filter.schema.required)

      console.log "OPTIONAL"
      printProperties keys, Filter.schema.properties, longestName: L

      printExamples Filter.schema
  else
    console.log "#{blue(filterName)} - No schema"

  console.log ""


# Runs this script
#
run = ->
  loadFilters (err, Filters) ->
    return log.error(err) if err

    try
      name = Program.args[0]
      for k, v of Filters
        if k.toLowerCase() == name.toLowerCase()
          name = k
          Filter = v

      if Filter
        prettyPrint name, Filter, Program
      else
        log.error "Filter not found: #{name}"
    catch e
      log.error e


loadFilters = (cb) ->
  Filters = []

  dummyProj =
    project: (pm) ->
      Filters = pm.filterCollection._filterClasses
      noop: 'does nothing'

  runProject dummyProj, (err) ->
    cb err, Filters


###
# Get filter descriptions
###
filterDescriptions = (cb) ->

  loadFilters (err, Filters) ->
    return cb(err) if err
    lines = []

    # calc longest name
    L = 0
    for name of Filters
      L = name.length if name.length > L

    # build description
    for name, Filter of Filters
      description = if Filter.schema?.title? then Filter.schema.title else ''
      lines.push Str.sprintf("    %-#{L}s  %s", name, description)

    cb null, lines.sort().join("\n")


Program.on "--help", ->
  filterDescriptions (err, descriptions) ->
    if err
      log.error err
    else
      console.log "  Available Filters:"
      console.log ""
      console.log descriptions

Program
  .version(Pkg.version)
  .description("Prints information about a filter")
  .usage("FILTER")
  .option("-j, --json", "Print out JSON")
  .parse(process.argv)


Program._name = 'pm filter'

if process.argv.length < 3
  Program.outputHelp()
else
  run()
