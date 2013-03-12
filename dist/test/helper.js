/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Assertion, assert, _ref;

_ref = require("chai"), assert = _ref.assert, Assertion = _ref.Assertion;

Assertion.includeStack = true;

module.exports = {
  assert: assert
};
