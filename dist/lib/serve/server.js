var Fs, Http, Https, Path, S, express, liveReload, log, readLocalProjfile, _;

Fs = require("fs");

Http = require("http");

Https = require("https");

Path = require("path");

S = require("string");

_ = require("lodash");

express = require("express");

log = require("../common/logger").getLogger("server");

liveReload = require("./liveReload");

readLocalProjfile = function(root) {
  var file, files, modu, projfilePath, _i, _len;
  if (root == null) {
    root = process.cwd();
  }
  files = ['Projfile.js', 'Projfile.coffee'];
  for (_i = 0, _len = files.length; _i < _len; _i++) {
    file = files[_i];
    projfilePath = Path.join(root, file);
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
  var app, aux, d, dirname, dname, httpDomain, httpPort, httpsConfig, httpsDomain, httpsPort, projfile, server, _i, _len;
  dirname = options.dirname || options.root;
  if (!dirname) {
    throw new Error("options.dirname is required");
  }
  dirname = Path.resolve(dirname);
  projfile = readLocalProjfile();
  options = _.defaults(options, projfile);
  if (projfile.dirname) {
    dirname = projfile.dirname;
  }
  aux = projfile.aux;
  if (aux) {
    aux.unshift(dirname);
  } else {
    aux = [dirname];
  }
  httpPort = options.httpPort || 1080;
  httpsPort = options.httpsPort || 1443;
  app = express();
  app.use(express.favicon());
  app.use(express.logger({
    immediate: true,
    format: "dev"
  }));
  app.use(express.compress());
  for (_i = 0, _len = aux.length; _i < _len; _i++) {
    d = aux[_i];
    app.use(express["static"](d));
  }
  app.use(express.directory(dirname));
  app.use(express.errorHandler());
  server = Http.createServer(app);
  liveReload.attach({
    server: server,
    app: app
  });
  server.listen(httpPort);
  httpsConfig = {
    key: Fs.readFileSync(__dirname + "/local.key"),
    cert: Fs.readFileSync(__dirname + "/local.crt")
  };
  server = Https.createServer(httpsConfig, app);
  server.listen(httpsPort);
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


/*
//@ sourceMappingURL=server.map
*/