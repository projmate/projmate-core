Fs = require("fs")
Http = require("http")
Https = require("https")
Path = require("path")
S = require("string")
_ = require("lodash")
express = require("express")
log = require("../common/logger").getLogger("server")
liveReload = require("./liveReload")

# Read server settings from local Projfile.
#
# @param {String} dirname The dirname.
#
readLocalProjfile = (root=process.cwd()) ->
  files = ['Projfile.js', 'Projfile.coffee']
  for file in files
    projfilePath = Path.join(root, file)
    if Fs.existsSync(projfilePath)
      require('coffee-script')  if file.match(/coffee$/)
      modu = require(projfilePath)
      return modu.server if modu.server
  {}


# Creates an HTTP and HTTPS server.
#
exports.run = (options) ->
  dirname = options.dirname
  throw new Error("options.dirname is required") unless dirname
  dirname = Path.resolve(dirname)

  # Projfile may define a `server` property for the server.
  projfile = readLocalProjfile()
  options = _.defaults(options, projfile)

  # _.defaults does not update dirname but we want it to
  dirname =  projfile.dirname if projfile.dirname

  aux = projfile.aux
  if aux
    aux.unshift dirname
  else
    aux = [dirname]

  httpPort = options.httpPort || 1080
  httpsPort = options.httpsPort || 1443

  app = express()
  app.use express.favicon()
  app.use express.logger(immediate: true, format: "dev")
  app.use express.compress()
  for d in aux
    app.use express.static(d)
  app.use express.directory(dirname)
  app.use express.errorHandler()

  server = Http.createServer(app)
  liveReload.attach {server, app}
  server.listen(httpPort)


  httpsConfig =
    key: Fs.readFileSync(__dirname+"/local.key")
    cert: Fs.readFileSync(__dirname+"/local.crt")
  server = Https.createServer(httpsConfig, app)
  server.listen(httpsPort)

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
