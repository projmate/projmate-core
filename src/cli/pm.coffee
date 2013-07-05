Fs = require("fs")
Path = require("path")
color = require('mgutz-colors').color
Logger = require('../lib/common/logger')
log = Logger.getLogger('pm')

process.on "uncaughtException", (err) ->
  message = err
  message = err.stack if (err.stack)
  log.error "Uncaught exception", message

pkg = require("../../package.json")
program = require("commander")

# print version
name = ('                    Projmate v' + pkg.version).slice(-Logger.rootConfig.columnWidths[0])
console.log "#{color(name, 'yellow+h')} #{color(Path.resolve(__dirname + '/../..'), 'yellow')}"


program
  .version(pkg.version)
  .extbang({".js": "node"}, __dirname)
  .command("create", "Creates a project from git repo")
  .command("filter", "Prints filter metadata")
  .command("run", "Runs one or more tasks in Projfile")
  .command("serve", "Serves pages from directory HTTP/HTTPS")
  .parse(process.argv)

program._name = 'pm'



