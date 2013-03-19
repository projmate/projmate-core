/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Utils, assert;

assert = require("./helper").assert;

Utils = require("../lib/common/utils");

describe("Utils", function() {
  return describe("isBinary", function() {
    it("should determine if a file is binary", function() {
      return assert.isTrue(Utils.isFileBinary("" + __dirname + "/res/favicon.ico"));
    });
    return it("should determine if a file is text", function() {
      return assert.isFalse(Utils.isFileBinary(__filename));
    });
  });
});
