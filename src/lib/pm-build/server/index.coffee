connect = require("connect")
log = require("../../common/logger").getLogger("server")
Fs = require("fs")
Https = require("https")
Http = require("http")
_ = require("lodash")


# Runs an HTTP and HTTPS server.
#
# @param {Object} options = {
#   {String} dirname="." The directory containing assets to serve.
#   {Number} http=8000   The HTTP port.
#   {Number} https=4430  The HTTPS port.
# }
exports.serve = (options) ->
  options = _.defaults(options, dirname: ".", http: 8000, https: 4430)

  app = connect()
    .use(connect.favicon())
    .use(connect.logger(immediate: true, format: "dev"))
    .use(connect.static(options.dirname))
    .use(errorHandler())
    .use(connect.cookieParser())
    .use(connect.session(secret: "projmate secret sauce"))

  Http.createServer(app).listen(options.http)

  httpsConfig =
    key: Fs.readFileSync(__dirname+"/local.key")
    cert: Fs.readFilesync(__dirname+"/local.crt")
  Https.createServer(httpsConfig, app).listen(options.https)

  log.info """
    Serving #{options.dirname}
      http://localhost:#{options.http}
      https://localhost:#{options.https}
  """

