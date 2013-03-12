var Utils, assert;

assert = require("./helper").assert;

Utils = require("../lib/common/utils");

describe("Utils", function() {
  return describe("isBinary", function() {
    it("should determine if a file is binary", function(done) {
      return Utils.isFileBinary("" + __dirname + "/res/favicon.ico", function(err, isBinary) {
        assert.isTrue(isBinary);
        return done();
      });
    });
    return it("should determine if a file is text", function(done) {
      return Utils.isFileBinary(__filename, function(err, isBinary) {
        assert.isFalse(isBinary);
        return done();
      });
    });
  });
});
