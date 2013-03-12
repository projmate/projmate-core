Fs = require("fs")
Http = require("http")
Https = require("https")
Path = require("path")
S = require("string")
connect = require("connect")
log = require("../common/logger").getLogger("server")

process.on "uncaughtException", (err) ->
  message = err
  message = err.stack if (err.stack) message = err.stack
  log.error "Uncaught exception", message


# Creates an HTTP and HTTPS server.
#
exports.run = (options) ->
  dirname = options.dirname
  throw new Error("options.dirname is required") unless dirname
  dirname = Path.resolve(dirname)

  httpPort = options.httpPort || 1080
  httpsPort = options.httpsPort || 1443

  server = connect()
  server.use connect.favicon()
  server.use connect.logger(immediate: true, format: "dev")
  server.use connect.static(dirname)
  server.use connect.directory(dirname)
  server.use connect.errorHandler()

  Http.createServer(server).listen(httpPort)
  httpsConfig =
    key: Fs.readFileSync(__dirname+"/local.key")
    cert: Fs.readFileSync(__dirname+"/local.crt")
  Https.createServer(httpsConfig, server).listen(httpsPort)

  httpDomain = "local.projmate.com"
  if httpPort != 80
    httpDomain += ":" + httpPort
  httpsDomain = "local.projmate.com"
  if httpsPort != 443
    httpsDomain += ":" + httpsPort

  dname = S(dirname)
    .chompLeft(process.cwd())
    .chompRight("/")
    .ensureLeft("/")
    .s

  dname = "/." if dname == "/"
  dname = "$PWD" + dname
  log.info """
    Serving #{dname} on
      http://#{httpDomain}
      https://#{httpsDomain}
  """
