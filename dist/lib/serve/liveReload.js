var Server, defaults, eventBus, fs, log, path, url, ws, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

fs = require('fs');

path = require('path');

ws = require('websocket.io');

url = require('url');

_ = require('lodash');

eventBus = require("../common/eventBus");

log = require("../common/logger").getLogger("server.liveReload");

defaults = {
  version: '7',
  port: 35729,
  delay: 50,
  applyJSLive: false,
  applyCSSLive: true,
  extnames: ['.html', '.css', '.js', '.png', '.gif', '.jpg', '.php']
};

Server = (function() {
  function Server(config) {
    this.config = config != null ? config : {};
    this.onClose = __bind(this.onClose, this);
    this.onConnection = __bind(this.onConnection, this);
    this.onAssetWritten = __bind(this.onAssetWritten, this);
    this.config = _.defaults(this.config, defaults);
    this.sockets = [];
    eventBus.on("asset:written", this.onAssetWritten);
  }

  Server.prototype.onAssetWritten = function(asset) {
    if (this.config.extnames.indexOf(asset.extname) > -1) {
      return this.reloadFile(asset.filename);
    }
  };

  Server.prototype.listen = function() {
    var config, server;
    log.debug("LiveReload is waiting for browser to connect.");
    config = this.config;
    server = ws.attach(config.server);
    server.on('connection', this.onConnection);
    return server.on('close', this.onClose);
  };

  Server.prototype.onConnection = function(socket) {
    var _this = this;
    socket.send(JSON.stringify({
      command: 'hello',
      protocols: ['http://livereload.com/protocols/official-7'],
      serverName: 'node-livereload'
    }));
    socket.on('message', function(message) {});
    return this.sockets.push(socket);
  };

  Server.prototype.onClose = function(socket) {};

  Server.prototype.reloadFile = function(filepath) {
    var config, data, socket, _i, _len, _ref, _results;
    config = this.config;
    log.debug("Reload file: " + filepath);
    data = JSON.stringify({
      command: 'reload',
      path: filepath,
      liveJS: config.applyJSLive,
      liveCSS: config.applyCSSLive
    });
    _ref = this.sockets;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      socket = _ref[_i];
      _results.push(socket.send(data));
    }
    return _results;
  };

  Server.prototype.reloadAll = function() {
    var data, socket, _i, _len, _ref, _results;
    log.debug("Reload all");
    data = JSON.stringify({
      command: 'reload',
      path: '*',
      liveJS: false,
      liveCSS: false
    });
    _ref = this.sockets;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      socket = _ref[_i];
      _results.push(socket.send(data));
    }
    return _results;
  };

  return Server;

})();

exports.attach = function(config) {
  var app, srv;
  app = config.app;
  srv = new Server(config);
  app.get('/livereload.js', function(req, res) {
    return res.sendfile("" + __dirname + "/js/livereload.js");
  });
  app.post('/reload', function(req, res) {
    var _this = this;
    setTimeout(function() {
      return server.reloadAll();
    }, server.config.delay);
    return res.send("");
  });
  srv.listen();
  return srv;
};


/*
//@ sourceMappingURL=liveReload.map
*/