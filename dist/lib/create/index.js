/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var $, Async, Fs, Path, Pkg, S, Sandbox, Temp, Utils, clone, cloneProject, getMeta, log, read, readSandboxedInputs, realUri, sandbox, template, updateMeta;

$ = require("projmate-shell");

Async = require("async");

Fs = require("fs");

Path = require("path");

Pkg = require("../../../package.json");

S = require("string");

Sandbox = require("sandbox");

Temp = require("temp");

Utils = require("../common/utils");

read = require("read");

log = require("../common/logger").getLogger("pm-create");

realUri = function(url) {
  var slashes;
  slashes = (url.match(/\//g) || []).length;
  if (slashes === 1) {
    return "git://github.com/" + url + ".git";
  } else {
    return url;
  }
};

cloneProject = function(url, dirname) {
  if (url.indexOf("file://") === 0) {
    url = S(url).chompLeft("file://").ensureRight("/").s;
    log.info("Copying " + url + " to " + dirname);
    return $.cp_rf(url, dirname);
  } else {
    return $.exec("git clone " + url + " " + dirname);
  }
};

clone = function(url, dirname, options, cb) {
  var fetchIt;
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  fetchIt = function() {
    var opts;
    if (Fs.existsSync(dirname)) {
      opts = {
        prompt: "Project " + dirname + " exists. Overwrite? Type yes or",
        "default": 'N'
      };
      return read(opts, function(err, result) {
        if (result === "yes") {
          $.rm_rf(dirname);
          cloneProject(url, dirname);
          return cb();
        } else {
          return cb("Project not created.");
        }
      });
    } else {
      cloneProject(url, dirname);
      return cb();
    }
  };
  if (options.subProject) {
    return Temp.mkdir('pm-create', function(err, tempDir) {
      var newUrl;
      cloneProject(url, tempDir);
      newUrl = "file://" + Path.join(tempDir, options.subProject);
      return clone(newUrl, dirname, cb);
    });
  } else {
    return fetchIt();
  }
};

sandbox = new Sandbox();

getMeta = function(source, cb) {
  source = "" + source + ";\nJSON.stringify(meta)";
  return sandbox.run(source, function(output) {
    var ex;
    try {
      return cb(null, JSON.parse(S(output.result).chompLeft("'").chompRight("'").s));
    } catch (_error) {
      ex = _error;
      return cb("Could not get meta (sandbox): " + ex.toString());
    }
  });
};

updateMeta = function(source, inputs, cb) {
  source = "" + source + ";\nvar fn, inputs = " + (JSON.stringify(inputs)) + ";\nfor (var key in meta) {\n  fn = meta[key];\n  if (typeof fn  === 'function') {\n    inputs[key] = fn.apply(inputs);\n  }\n}\nJSON.stringify(inputs)";
  return sandbox.run(source, function(output) {
    var ex, res;
    try {
      res = S(output.result).chompLeft("'").chompRight("'").s;
      return cb(null, JSON.parse(res));
    } catch (_error) {
      ex = _error;
      return cb("Could not update meta (sandbox): " + ex.toString());
    }
  });
};

readSandboxedInputs = function(dirname, cb) {
  var meta, metaFile, projectName;
  metaFile = dirname + "/__meta.js";
  if (!Fs.existsSync(dirname + "/__meta.js")) {
    return cb("Invalid project skeleton, `__meta.js` not found");
  }
  projectName = Path.basename(dirname);
  meta = Fs.readFileSync(metaFile, "utf8");
  $.rm(metaFile);
  return getMeta(meta, function(err, inputs) {
    if (err) {
      return console.error(err);
    }
    return Async.eachSeries(Object.keys(inputs), function(key, cb) {
      var opts;
      opts = {
        prompt: "Enter " + inputs[key] + ": "
      };
      if (key === "project") {
        opts["default"] = projectName;
      }
      return read(opts, function(err, result) {
        if (err) {
          return cb(err);
        }
        if (S(result).isEmpty()) {
          return cb("All inputs are required");
        }
        inputs[key] = result;
        return cb();
      });
    }, function(err) {
      if (err) {
        return cb(err);
      }
      inputs.VERSION = Pkg.version;
      return updateMeta(meta, inputs, cb);
    });
  });
};

template = function(text, locals) {
  var key, value;
  for (key in locals) {
    value = locals[key];
    text = text.replace(new RegExp("\\{\\{pm__" + key + "}}", "g"), value);
  }
  return text;
};

exports.run = function(options) {
  var dirname, fetchProject, inputs, readUserInput, updateFileAndContentTemplates, url;
  if (options == null) {
    options = {};
  }
  if (!options.url) {
    return log.error("options.url is required");
  }
  url = realUri(options.url);
  dirname = options.project || process.cwd();
  inputs = {};
  fetchProject = function(cb) {
    return clone(url, dirname, options, cb);
  };
  readUserInput = function(cb) {
    return readSandboxedInputs(dirname, function(err, readInputs) {
      inputs = readInputs;
      return cb(err);
    });
  };
  updateFileAndContentTemplates = function(cb) {
    var ex;
    try {
      Utils.walkDirSync(dirname, true, function(dirname, subdirs, files) {
        var content, dir, file, newPath, path, _i, _j, _len, _len1, _results;
        for (_i = 0, _len = subdirs.length; _i < _len; _i++) {
          dir = subdirs[_i];
          path = Path.join(dirname, dir);
          if (dir.indexOf("{{") >= 0) {
            newPath = Path.join(dirname, template(dir, inputs));
            $.mv(path, newPath);
          }
        }
        _results = [];
        for (_j = 0, _len1 = files.length; _j < _len1; _j++) {
          file = files[_j];
          path = Path.join(dirname, file);
          if (!Utils.isFileBinary(path)) {
            content = Fs.readFileSync(path, "utf8");
            if (content.indexOf("{{") >= 0) {
              content = template(content, inputs);
              Fs.writeFileSync(path, content);
            }
          }
          if (file.indexOf("{{") >= 0) {
            newPath = Path.join(dirname, template(file, inputs));
            _results.push($.mv(path, newPath));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
      return cb();
    } catch (_error) {
      ex = _error;
      return cb(ex);
    }
  };
  return Async.series([fetchProject, readUserInput, updateFileAndContentTemplates], function(err) {
    if (err) {
      return log.error(err);
    }
    return log.info("OK");
  });
};
