// Generated by CoffeeScript 1.5.0
(function() {
  var Assetx, assert, fileContains, getResource, isSingleLine, path, x, _ref;

  assert = require("chai").assert;

  Assetx = require("..");

  _ref = require("./helpers"), getResource = _ref.getResource, isSingleLine = _ref.isSingleLine, fileContains = _ref.fileContains;

  path = require("path");

  x = null;

  describe("assetx filters", function() {
    before(function() {
      var app, assetx;
      app = {
        version: "3.0.x"
      };
      assetx = new Assetx({
        baseDir: __dirname,
        outputDir: path.join(__dirname, "output"),
        filters: ["cssmin", "uglify"]
      });
      return assetx.attach({
        app: app
      }, function(err) {
        return x = app.locals.x;
      });
    });
    it("should compress js", function() {
      var filename, out;
      out = x.script("res/foo.js");
      assert.isTrue(out.indexOf("--") > 0);
      filename = getResource(out);
      assert.isTrue(isSingleLine(filename));
      return assert.isTrue(fileContains(filename, /t\.html/));
    });
    return it("should compile less", function() {
      var filename, out;
      out = x.stylesheet("res/test.css");
      filename = getResource(out);
      assert.isTrue(isSingleLine(filename));
      assert.isTrue(out.indexOf("--") > 0);
      return assert.isTrue(fileContains(filename, /red/));
    });
  });

}).call(this);
