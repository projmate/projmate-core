/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var When;

When = require("when");

module.exports = {
  defer: When.defer,
  sequence: require("when/sequence")
};


/*
//@ sourceMappingURL=src/lib/common/promise.map
*/