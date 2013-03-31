/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var colors = require('mgutz-colors');
var color = colors.color;

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


function dumpError(err) {
  var output = '';
  var key;
  if (!err) return output;

  if (err instanceof Error) {
    for (key in err) {
      if (key === 'stack' || key === 'message') continue;
      output += key + ': ' + err[key];
    }
    output += err.stack;

  } else if (_.isObject(err)) {
    // show important fields first
    var important = ['message', 'filename', 'line', 'column'];
    for (key in err) {
      if (important.indexOf(key) < 0) continue;
      output += key + ': ' + err[key];
    }
    for (key in err) {
      if (important.indexOf(key) >= 0) continue;
      output += key + ': ' + err[key];
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
    stdout.write(output);
  }
}

module.exports = AnsiConsoleAppender;