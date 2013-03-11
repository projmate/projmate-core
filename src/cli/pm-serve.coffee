Pkg = require("../../package.json")
Program = require("commander")
Server = require("../lib/pm-serve/server")


# Runs the server
#
main = ->
  try
    Program.dirname = Program.args[0] || "."
    Server.run Program
  catch ex
    console.error ex.toString()

Program
  .version(Pkg.version)
  .usage("[dirname] [options]")
  .option("-p, --http-port <port>", "HTTP port", 1080)
  .option("-P, --https-port <ssl port>", "HTTPS port", 1443)
  .parse(process.argv)

main()