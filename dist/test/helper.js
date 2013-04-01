/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Assertion, Logger, Runner, assert, _ref;

_ref = require("chai"), assert = _ref.assert, Assertion = _ref.Assertion;

Assertion.includeStack = true;

Runner = require("../lib/run/runner");

Logger = require("../lib/common/logger");

module.exports = {
  assert: assert,
  runProject: function(project, program, cb) {
    var runner;

    runner = new Runner({
      program: program
    });
    return runner.load(project, {
      cwd: __dirname
    }, function(err) {
      if (err) {
        console.error(err);
      }
      return runner.executeTasks(program.tasks, function(err) {
        return cb(err);
      });
    });
  }
};
