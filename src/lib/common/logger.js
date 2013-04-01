/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var colors = require("mgutz-colors");
var color = colors.color;
var _ = require('lodash');
var AnsiConsoleAppender = require('./appenders/ansiConsoleAppender');

function blackhole() {
  return;
}

var levels = exports.levels = {
  all: -100,
  log: 1,
  debug: 1,
  // debug is not supported by IE
  info: 2,
  warn: 3,
  error: 4,
  off: 100
};

var rootConfig = exports.rootConfig = {
  levels: levels,
  level: levels.log,
  silent: false,
  // column widths
  columnWidths: [20]
};
rootConfig.appender = new AnsiConsoleAppender(rootConfig);

var loggers = {};

function Logger(name, level, appender) {
  this.name = name;
  // this must be set before setLevel
  this.appender = appender || rootConfig.appender;
  this.setLevel(this.level || rootConfig.level);
}

Logger.prototype.setLevel = function(level) {
  if (this.level === level) return;
  this.level = level;
  if (this.appender) {
    this.log = (level > levels.log) ? this.blackhole : this.appender.log;
    this.debug = (level > levels.debug) ? this.blackhole : this.appender.debug;
    this.info = (level > levels.info) ? this.blackhole : this.appender.info;
    this.warn = (level > levels.warn) ? this.blackhole : this.appender.warn;
    this.error = (level > levels.error) ? this.blackhole : this.appender.error;
  }
};

Logger.prototype.blackhole = function() {};



Logger.prototype.setAppender = function(appender) {
  if (!appender && !this.appender)
    throw new Error('Appender is required');
  if (appender)
    this.appender = appender;
  this.setLevel(this.level);
};

Logger.prototype.silent = function(truthy) {
  if (truthy) {
    this.log = blackhole;
    this.debug = blackhole;
    this.info = blackhole;
    this.warn = blackhole;
    this.error = blackhole;
  } else {
    this.setAppender();
  }
}

exports.getLogger = function(name, level, appender) {
  return loggers[name] ? loggers[name] : loggers[name] = new Logger(name, level, appender);
};

exports.setLevels = function(levelString) {
  rootConfig.level = levels[levelString]
  _(loggers).forOwn(function(logger) {
    logger.setLevel(rootConfig.level);
  });
};


// logmagic.setSinkOptions "console", timestamp: ->
//   d = new Date

//   # pad
//   pad2 = (n) -> if n < 10 then '0' + n else n

//   pad3 = (n) ->
//     if n > 99
//       n
//     else if n > 9
//       '0' + n
//     else
//       '00' + n

//   pad2(d.getHours())        + ':' +
//   pad2(d.getMinutes())      + ':' +
//   pad2(d.getSeconds())      + '.' +
//   pad3(d.getMilliseconds())
