/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var $, Buffer, Fs, Path, Utils, getEncoding, globEx;

Fs = require("fs");

Path = require("path");

Buffer = require('buffer').Buffer;

$ = require("projmate-shell");

globEx = require("./globEx");

getEncoding = function(buffer, count) {
  var charCode, contentStartBinary, contentStartUTF8, encoding, i, _i, _ref;

  contentStartBinary = buffer.toString('binary', 0, count);
  contentStartUTF8 = buffer.toString('utf8', 0, count);
  encoding = 'utf8';
  for (i = _i = 0, _ref = contentStartUTF8.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    charCode = contentStartUTF8.charCodeAt(i);
    if (charCode === 65533 || charCode <= 8) {
      encoding = 'binary';
      break;
    }
  }
  return encoding;
};

Utils = {
  glob: globEx,
  between: function(s, startToken, endToken) {
    var endPos, start, startPos;

    startPos = s.indexOf(startToken);
    endPos = s.indexOf(endToken);
    start = startPos + startToken.length;
    if (endPos > startPos) {
      return s.slice(start, endPos);
    } else {
      return "";
    }
  },
  lchomp: function(s, substr) {
    if (~s.indexOf(substr)) {
      return s.slice(substr.length);
    } else {
      return s;
    }
  },
  rensure: function(s, str) {
    if (s[str.length - 1] === str) {
      return s;
    } else {
      return s += str;
    }
  },
  unixPath: function(s) {
    if (Path.sep === "\\") {
      return s.replace(/\\/g, "/");
    } else {
      return s;
    }
  },
  changeExtname: function(filename, extname) {
    return filename.replace(/\.\w+$/, extname);
  },
  findDirUp: function(basename, dir) {
    var parent;

    if (dir == null) {
      dir = process.cwd();
    }
    if (Fs.existsSync(Path.join(dir, basename))) {
      return dir;
    }
    parent = Path.normalize(Path.join(dir, ".."));
    if (parent !== dir) {
      return Utils.findDirUp(basename, parent);
    } else {
      return null;
    }
  },
  isFileBinary: function(filename) {
    var buffer, count, fd;

    fd = Fs.openSync(filename, "r");
    buffer = new Buffer(24);
    count = Fs.readSync(fd, buffer, 0, 24, 0);
    Fs.closeSync(fd);
    return getEncoding(buffer, count - 1) === "binary";
  },
  walkDirSync: function(start, deepestFirst, callback) {
    var coll, control, filenames, stat;

    stat = Fs.statSync(start);
    if (typeof arguments[1] === 'function') {
      callback = arguments[1];
      deepestFirst = false;
    }
    if (stat.isDirectory()) {
      filenames = Fs.readdirSync(start);
      coll = filenames.reduce(function(acc, name) {
        var abspath;

        abspath = Path.join(start, name);
        if (Fs.statSync(abspath).isDirectory()) {
          acc.dirs.push(name);
        } else {
          acc.names.push(name);
        }
        return acc;
      }, {
        "names": [],
        "dirs": []
      });
      control = {};
      if (!deepestFirst) {
        callback(start, coll.dirs, coll.names, control);
      }
      if (control.stop == null) {
        coll.dirs.forEach(function(d) {
          var abspath;

          abspath = Path.join(start, d);
          return Utils.walkDirSync(abspath, deepestFirst, callback);
        });
      }
      if (deepestFirst) {
        return callback(start, coll.dirs, coll.names);
      }
    } else {
      throw new Error("path: " + start + " is not a directory");
    }
  },
  outdated: function(target, reference) {
    var referenceStat, targetStat;

    if (!Fs.existsSync(target)) {
      return true;
    }
    referenceStat = Fs.statSync(reference);
    targetStat = Fs.statSync(target);
    return referenceStat.mtime.getTime() > targetStat.mtime.getTime();
  },
  escapeRegExp: function(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  },
  relativeToHome: function(path) {
    return path.replace(RegExp(Utils.escapeRegExp($.homeDir()), "i"), "~");
  },
  relativeToCwd: function(path, cwd) {
    if (cwd == null) {
      cwd = process.cwd();
    }
    return path.replace(RegExp(Utils.escapeRegExp(cwd), "i"), ".");
  }
};

module.exports = Utils;
