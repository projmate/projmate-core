/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Fs, Http, Https, Path, S, connect, log, readLocalProjfile, _;

Fs = require("fs");

Http = require("http");

Https = require("https");

Path = require("path");

S = require("string");

_ = require("lodash");

connect = require("connect");

log = require("../common/logger").getLogger("server");

readLocalProjfile = function(dirname) {
  var file, files, modu, projfilePath, _i, _len;

  files = ['Projfile.js', 'Projfile.coffee'];
  for (_i = 0, _len = files.length; _i < _len; _i++) {
    file = files[_i];
    projfilePath = Path.join(dirname, file);
    if (Fs.existsSync(projfilePath)) {
      if (file.match(/coffee$/)) {
        require('coffee-script');
      }
      modu = require(projfilePath);
      if (modu.server) {
        return modu.server;
      }
    }
  }
  return {};
};

exports.run = function(options) {
  var dirname, dname, httpDomain, httpPort, httpsConfig, httpsDomain, httpsPort, projfile, server;

  dirname = options.dirname;
  if (!dirname) {
    throw new Error("options.dirname is required");
  }
  dirname = Path.resolve(dirname);
  projfile = readLocalProjfile(dirname);
  options = _.defaults(options, projfile);
  if (projfile.dirname) {
    dirname = projfile.dirname;
  }
  httpPort = options.httpPort || 1080;
  httpsPort = options.httpsPort || 1443;
  server = connect();
  server.use(connect.favicon());
  server.use(connect.logger({
    immediate: true,
    format: "dev"
  }));
  server.use(connect["static"](dirname));
  server.use(connect.directory(dirname));
  server.use(connect.errorHandler());
  Http.createServer(server).listen(httpPort);
  httpsConfig = {
    key: Fs.readFileSync(__dirname + "/local.key"),
    cert: Fs.readFileSync(__dirname + "/local.crt")
  };
  Https.createServer(httpsConfig, server).listen(httpsPort);
  httpDomain = "local.projmate.com";
  if (httpPort !== 80) {
    httpDomain += ":" + httpPort;
  }
  httpsDomain = "local.projmate.com";
  if (httpsPort !== 443) {
    httpsDomain += ":" + httpsPort;
  }
  dname = S(dirname).chompLeft(process.cwd()).chompRight("/").ensureLeft("/").s;
  if (dname === "/") {
    dname = "/.";
  }
  dname = "$PWD" + dname;
  return log.info("Serving " + dname + " on\n  http://" + httpDomain + "\n  https://" + httpsDomain);
};
