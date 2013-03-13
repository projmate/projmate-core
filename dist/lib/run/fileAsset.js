/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var FileAsset, Fs, Path, Utils, log, mkdirp;

Fs = require("fs");

Path = require("path");

mkdirp = require("mkdirp");

log = require("../common/logger").getLogger("FileAsset");

Utils = require("../common/utils");

Function.prototype.property = function(prop, desc) {
  return Object.defineProperty(this.prototype, prop, desc);
};

FileAsset = (function() {

  function FileAsset(options) {
    var cwd, filename, parent, stat, text;
    cwd = options.cwd, filename = options.filename, parent = options.parent, text = options.text, stat = options.stat;
    if (options.parent == null) {
      throw new Error("parent property is required");
    }
    filename = Utils.unixPath(filename);
    this.filename = filename;
    this.originalFilename = filename;
    this._extname = Path.extname(filename);
    this.dirname = Path.dirname(filename);
    this.basename = Path.basename(filename);
    this.cwd = cwd;
    this.stat = stat;
    this._text = text;
    this.parent = parent;
  }

  FileAsset.property("text", {
    get: function() {
      return this._text;
    },
    set: function(text) {
      return this._text = text;
    }
  });

  FileAsset.property("extname", {
    get: function() {
      return this._extname;
    },
    set: function(ext) {
      this.basename = Path.basename(this.basename, this._extname) + ext;
      this.filename = Utils.unixPath(Path.join(this.dirname, this.basename));
      return this._extname = ext;
    }
  });

  FileAsset.prototype.toString = function() {
    return "originalFilename: " + this.originalFilename + "\nfilename: " + this.filename + "\nextname: " + this.extname + "\ndirname: " + this.dirname + "\nbasename: " + this.basename + "\ntext: " + this.text + "\n==============================================================================";
  };

  FileAsset.prototype.read = function(cb) {
    return Fs.readFile(this.filename, PROJMATE.encoding, cb);
  };

  FileAsset.prototype.write = function(filename, cb) {
    var text;
    if (filename == null) {
      filename = this.filename;
    }
    text = this.text;
    if (text.length === 0) {
      return cb();
    }
    return mkdirp(Path.dirname(filename), function(err) {
      if (err) {
        return cb(err);
      }
      return Fs.writeFile(filename, text, PROJMATE.encoding, function(err) {
        if (err) {
          return cb(err);
        }
        log.info("Wrote " + filename);
        return cb();
      });
    });
  };

  FileAsset.prototype.newerThan = function(reference) {
    var referenceStat;
    if (!this.stat) {
      return true;
    }
    if (!Fs.existsSync(reference)) {
      return true;
    }
    referenceStat = Fs.statSync(reference);
    return this.stat.mtime.getTime() > referenceStat.mtime.getTime();
  };

  return FileAsset;

})();

module.exports = FileAsset;
