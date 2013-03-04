Fs = require("fs")
Path = require("path")
{glob} = require("multi-glob")


##
# Displays usage by gathering metadata from `pm-COMMAND` scripts.
#
usage = ->

  glob "#{__dirname}/pm-*.js", (err, files) ->
    return console.error(err) if err

    commandHelp = ""
    for file in files
      moduleFile = file.slice("#{__dirname}/".length)
      script = requireScript(moduleFile)
      if script
        commandHelp += "  #{script.meta.name}\t\t#{script.meta.description}"

    console.log """
pm COMMAND [OPTIONS]

COMMANDS
  help COMMAND  Displays help about specific command
#{commandHelp}
"""


##
# Retrieve a command script"s module.
#
# @param name
# @returns {*}
#
requireScript = (name) ->
  if Fs.existsSync(Path.join(__dirname,  name))
    moduleName = Path.basename(name, Path.extname(name))
    return require("./#{moduleName}")
  return null


##
# Runs `pm-COMMAND` script.
#
main = ->
  # first two argumenst are `node` and script path
  command = process.argv[2]

  printScriptUsage = (script) ->
    script.meta.usage (err, message) ->
      if err
        console.error(err)
      else
        console.log(message)

  if command == "help"
    command = process.argv[3]
    file = "pm-#{command}.js"
    script = requireScript(file)
    if script
      printScriptUsage script
    else
      console.error "Command not found: #{command}"

  else if command == "--help" or command == "-?"
    usage()

  # run pm-COMMAND script
  else if command
    file = "pm-#{command}.js"
    script = requireScript(file)
    if !script
      console.error "Command not found: #{command}"
      process.exit 1

    # no need to run if user is only asking for help
    nextCommand = process.argv[3]
    if nextCommand == "-?" or nextCommand == "--help"
      printScriptUsage script
    else
      script.run()

  else
    usage()


main()
