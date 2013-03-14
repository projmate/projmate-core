Fs = require("fs")
Http = require("http")
Https = require("https")
Path = require("path")
S = require("string")
_ = require("lodash")
connect = require("connect")
log = require("../common/logger").getLogger("server")

# Read server settings from local Projfile.
#
# @param {String} dirname The dirname.
#
readLocalProjfile = (dirname) ->
  files = ['Projfile.js', 'Projfile.coffee']
  for file in files
    projfilePath = Path.join(dirname, file)
    if Fs.existsSync(projfilePath)
      require('coffee-script')  if file.match(/coffee$/)
      modu = require(projfilePath)
      console.log "modul", modu
      return modu.server if modu.server
  {}


# Creates an HTTP and HTTPS server.
#
exports.run = (options) ->
  dirname = options.dirname
  throw new Error("options.dirname is required") unless dirname
  dirname = Path.resolve(dirname)

  # Projfile may define a `server` property for the server.
  projfile = readLocalProjfile(dirname)
  options = _.defaults(options, projfile)

  # _.defaults does not update dirname but we want it to
  dirname =  projfile.dirname if projfile.dirname

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
