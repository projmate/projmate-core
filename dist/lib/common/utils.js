// Generated by CoffeeScript 1.6.1
(function() {
  var Buffer, Fs, Path, Utils, getEncoding;

  Fs = require("fs");

  Path = require("path");

  Buffer = require('buffer').Buffer;

  getEncoding = function(buffer) {
    var charCode, contentStartBinary, contentStartUTF8, encoding, i, _i, _ref;
    contentStartBinary = buffer.toString('binary', 0, 24);
    contentStartUTF8 = buffer.toString('utf8', 0, 24);
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
    isFileBinary: function(filename, cb) {
      return Fs.open(filename, "r", function(err, fd) {
        var buffer;
        if (err) {
          return cb(err);
        }
        buffer = new Buffer(24);
        return Fs.read(fd, buffer, 0, 24, 0, function(err, num) {
          if (err) {
            return cb(err);
          }
          Fs.close(fd);
          return cb(null, getEncoding(buffer) === "binary");
        });
      });
    }
  };

  module.exports = Utils;

}).call(this);
