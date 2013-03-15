Fs = require("fs")
Path = require("path")

process.on "uncaughtException", (err) ->
  message = err
  message = err.stack if (err.stack)
  console.error "Uncaught exception", message

pkg = require("../../package.json")
program = require("commander")

program
  .version(pkg.version)
  .extbang({".js": "node"}, __dirname)
  .command("create", "Creates a project from git repo")
  .command("run", "Runs one or more tasks in Projfile")
  .command("serve", "Serves pages from directory HTTP/HTTPS")
  .parse(process.argv)



