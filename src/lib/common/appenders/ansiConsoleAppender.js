var colors = require('mgutz-colors');
var color = colors.color;
var _ = require('lodash');

function pp(object, depth, embedded) {
  typeof (depth) == "number" || (depth = 0)
  typeof (embedded) == "boolean" || (embedded = false)
  var newline = false
  var spacer = function (depth) {
    var spaces = "";
    for (var i = 0; i < depth; i++) {
      spaces += "  "
    };
    return spaces
  }
  var pretty = ""
  if (typeof (object) == "undefined") {
    pretty += "undefined"
  } else if (typeof (object) == "boolean" ||
    typeof (object) == "number") {
    pretty += object.toString()
  } else if (typeof (object) == "string") {
    pretty += "\"" + object + "\""
  } else if (object == null) {
    pretty += "null"
  } else if (object instanceof(Array)) {
    if (object.length > 0) {
      if (embedded) {
        newline = true
      }
      var content = ""
      for (var item in object) {
        content += pp(item, depth + 1) + ",\n" + spacer(depth + 1)
      }
      content = content.replace(/,\n\s*$/, "").replace(/^\s*/, "")
      pretty += "[ " + content + "\n" + spacer(depth) + "]"
    } else {
      pretty += "[]"
    }
  } else if (typeof (object) == "object") {
    if (Object.keys(object).length > 0) {
      if (embedded) {
        newline = true
      }
      var content = ""
      for (var key in object) {
        content += spacer(depth + 1) + key.toString() + ": " + pp(object[key], depth + 2, true) + ",\n"
      }
      content = content.replace(/,\n\s*$/, "").replace(/^\s*/, "")
      pretty += "{ " + content + "\n" + spacer(depth) + "}"
    } else {
      pretty += "{}"
    }
  } else {
    pretty += object.toString()
  }
  return ((newline ? "\n" + spacer(depth) : "") + pretty)
}


//"red"            // red
//"red+b"          // red bold
//"red+u"          // red underline
//"red+bh"         // red bold high-intensity
//"red:white"      // red on white
//"red+b:white+h"  // red bold on white high-intensity
//
//colors: black, white, red, yellow, green, cyan, blue, magenta
//
//attributes: b=bold, h=high intensity, u=underline

function formatObject() {
}

function dumpError(err) {
  //return pp(err);
  var output = '';
  var key;
  if (!err) return output;

  if (err instanceof Error) {
    output += '\n';
    for (key in err) {
      if (key === 'stack' || key === 'message') continue;
      output += key + ': ' + err[key] + '\n';
    }
    output += err.stack;

  } else if (_.isObject(err)) {
    output += '\n';
    // show important fields first
    var important = ['message', 'filename', 'line', 'column'];
    for (key in err) {
      if (important.indexOf(key) < 0) continue;
      output += key + ': ' + err[key] + '\n';
    }
    for (key in err) {
      if (important.indexOf(key) >= 0) continue;
      output += key + ': ' + err[key] + '\n';
    }

  } else {
    output += err;
  }
  return output;
}

function darkScheme(levels) {
  this[levels.log] = colors.ansi('black+h');
  this[levels.log+1000] = colors.ansi('black+h');

  this[levels.debug] = colors.ansi('black+h');
  this[levels.debug+1000] = colors.ansi('black+h');

  this[levels.info] = colors.ansi('cyan');
  this[levels.info+1000] = colors.ansi('cyan+h');

  this[levels.warn] = colors.ansi('magenta');
  this[levels.warn+1000] = colors.ansi('magenta+h');

  this[levels.error] = colors.ansi('red');
  this[levels.error+1000] = colors.ansi('red+h');
  return this;
}

var spaces = '                    ';
var stdout = process.stdout;

// DO NOT refactor, no point making extra function calls
function AnsiConsoleAppender(rootConfig, colorScheme) {
  // short for color table
  var ctab = colorScheme || darkScheme(rootConfig.levels);
  var columnWidths = rootConfig.columnWidths;
  var levels = rootConfig.levels;


  this.setColorScheme = function(scheme) {
    ctab = scheme;
  };

  // DO NOT REFACTOR, only a few functions that need to remain fast, minimize function calls

  this.log = function(message, etc) {
    if (rootConfig.silent) return;
    var ansi = ctab[levels.log];
    var ansih = ctab[levels.log+1000];
    var output = ansih + (spaces + this.name).slice(-columnWidths[0]);
    output += ' ' + ansi + message + '\n';
    if (etc) {
      output += ansi + etc + '\n';
    }
    output += colors.reset;
    stdout.write(output);
  };


  this.debug = function(message, etc) {
    if (rootConfig.silent) return;
    var ansi = ctab[levels.debug];
    var ansih = ctab[levels.debug+1000];
    var output = ansih + (spaces + this.name).slice(-columnWidths[0]);
    output += ' ' + ansi + message + '\n';
    if (etc) {
      output += ansi + etc + '\n';
    }
    output += colors.reset;
    stdout.write(output);
  };

  this.info = function(message, etc) {
    if (rootConfig.silent) return;
    var ansi = ctab[levels.info];
    var ansih = ctab[levels.info+1000];
    var output = ansih + (spaces + this.name).slice(-columnWidths[0]);
    output += ' ' + ansi + message + '\n';
    if (etc) {
      output += ansi + etc + '\n';
    }
    output += colors.reset;
    stdout.write(output);
  };

  this.warn = function(message, etc) {
    if (rootConfig.silent) return;
    var ansi = ctab[level.warn];
    var ansih = ctab[levels.warn+1000];
    var output = ansih + (spaces + this.name).slice(-columnWidths[0]);
    output += ' ' + ansi + message + '\n';
    if (etc) {
      output += ansi + etc + '\n';
    }
    output += colors.reset;
    stdout.write(output);
  };

  this.error = function(message, etc) {
    if (rootConfig.silent) return;
    var ansi = ctab[levels.error];
    var ansih = ctab[levels.error+1000];
    var output = ansih + (spaces + this.name).slice(-columnWidths[0]);
    output += ' ';
    if (etc) {
      output += ansi + etc + '\n';
    }
    output += ansih + dumpError(message);
    output += ansih + dumpError(etc);
    output += colors.reset;
    output += '\n';
    stdout.write(output);
  }
}

module.exports = AnsiConsoleAppender;
