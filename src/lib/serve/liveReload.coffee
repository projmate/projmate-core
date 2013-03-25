fs   = require 'fs'
path = require 'path'
ws   = require 'websocket.io'
url = require 'url'
_ = require 'lodash'
eventBus = require("../common/eventBus")
log = require("../common/logger").getLogger("server.liveReload")

defaults =
  version: '7'
  port: 35729
  delay: 50
  applyJSLive: false
  applyCSSLive: true
  extnames: ['.html', '.css', '.js', '.png', '.gif', '.jpg', '.php']


class Server

  constructor: (@config={}) ->
    @config = _.defaults(@config, defaults)
    @sockets = []
    eventBus.on "asset:written", @onAssetWritten

  onAssetWritten: (asset) =>
    if @config.extnames.indexOf(asset.extname) > -1
      @reloadFile asset.filename

  listen: ->
    log.debug "LiveReload is waiting for browser to connect."
    config = @config

    server = ws.attach(config.server)
    server.on 'connection', @onConnection
    server.on 'close', @onClose


  onConnection: (socket) =>
    log.debug "Browser connected."

    socket.send JSON.stringify
      command: 'hello',
      protocols: [
        'http://livereload.com/protocols/official-7'
      ]
      serverName: 'node-livereload'

    socket.on 'message', (message) =>
      log.debug "Browser URL: #{message}"

    @sockets.push socket


  onClose: (socket) =>
    log.debug "Browser disconnected."


  reloadFile: (filepath) ->
    config = @config
    log.debug "Reload file: #{filepath}"
    data = JSON.stringify
      command: 'reload',
      path: filepath,
      liveJS: config.applyJSLive,
      liveCSS: config.applyCSSLive

    for socket in @sockets
      socket.send data


  reloadAll: ->
    log.debug "Reload all"
    data = JSON.stringify
      command: 'reload',
      path: '*'
      liveJS: false,
      liveCSS: false

    for socket in @sockets
      socket.send data


exports.attach = (config) ->
  {app} = config
  srv = new Server(config)

  #app.use express.static "#{__dirname}/../ext"
  app.get '/livereload.js', (req, res) ->
    res.sendfile "#{__dirname}/js/livereload.js"
  app.post '/reload', (req, res) ->
    setTimeout =>
      do server.reloadAll
    , server.config.delay
    res.send ""

  srv.listen()
  srv
