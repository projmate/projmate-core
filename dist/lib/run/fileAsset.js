/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var FileAsset, Fs, Path, Promises, Utils, Vow, eventBus, log, mkdirp;

Fs = require("fs");

Path = require("path");

mkdirp = require("mkdirp");

log = require("../common/logger").getLogger("FileAsset");

Utils = require("../common/utils");

Vow = require('vow');

eventBus = require("../common/eventBus");

Promises = require('../common/promises');

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
    this._filename = filename;
    this.originalFilename = filename;
    this._extname = Path.extname(filename);
    this._dirname = Path.dirname(filename);
    this.basename = Path.basename(filename);
    this.cwd = cwd;
    this.stat = stat;
    this._text = text;
    this.parent = parent;
    this.writingPromises = [];
  }

  FileAsset.property("filename", {
    get: function() {
      return this._filename;
    },
    set: function(fname) {
      var filename;
      filename = Utils.unixPath(fname);
      this._filename = filename;
      this._extname = Path.extname(filename);
      this._dirname = Path.dirname(filename);
      return this._basename = Path.basename(filename);
    }
  });

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
      this.filename = Utils.unixPath(Path.join(this._dirname, this._basename));
      return this._extname = ext;
    }
  });

  FileAsset.property("dirname", {
    get: function() {
      return this._dirname;
    },
    set: function(dirname) {
      this._dirname = dirname;
      return this._filename = Utils.unixPath(Path.join(dirname, this._basename));
    }
  });

  FileAsset.property("basename", {
    get: function() {
      return this._basename;
    },
    set: function(basename) {
      this._basename = basename;
      this._extname = Path.extname(basename);
      return this._filename = Utils.unixPath(Path.join(this._dirname, this._basename));
    }
  });

  FileAsset.prototype.toString = function() {
    return "originalFilename: " + this.originalFilename + "\nfilename: " + this.filename + "\nextname: " + this.extname + "\ndirname: " + this.dirname + "\nbasename: " + this.basename + "\ntext: " + this.text + "\n==============================================================================";
  };

  FileAsset.prototype.read = function(cb) {
    return Fs.readFile(this.filename, PROJMATE.encoding, cb);
  };

  FileAsset.prototype.whenWriting = function(promise) {
    return this.writingPromises.push(promise);
  };

  FileAsset.prototype.write = function(filename, cb) {
    var that;
    if (filename == null) {
      filename = this.filename;
    }
    that = this;
    return Promises.parallel(this.writingPromises).then(function() {
      var text;
      text = that.text;
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
          eventBus.emit("asset:written", that);
          return cb();
        });
      });
    }).then(null, function(err) {
      return cb(err);
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

  FileAsset.property("filterOptions", {
    get: function() {
      return this.__filterOptions;
    },
    set: function(options) {
      return this.__filterOptions = options;
    }
  });

  return FileAsset;

})();

module.exports = FileAsset;
