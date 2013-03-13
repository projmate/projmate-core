Pkg = require("../../package.json")
program = require("commander")
Server = require("../lib/serve/server")
Fs = require("fs")

findProjfile = ->
  files = ['Projfile.js', 'Projfile.coffee']
  for file in files
    if Fs.existsSync(file)
      return file
  null


# Runs the server.
#
main = ->
  try
    program.dirname = program.args[0] || "."
    Server.run program
  catch ex
    console.error ex.toString()


# Configure command line options.
#
program
  .version(Pkg.version)
  .usage("[dirname] [options]")
  .option("-p, --http-port <port>", "HTTP port")
  .option("-P, --https-port <ssl port>", "HTTPS port")
  .parse(process.argv)


main()

