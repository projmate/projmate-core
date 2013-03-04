assert = require("chai").assert
Assetx = require("..")
{getResource, isSingleLine, fileContains} = require("./helpers")
path = require("path")

x = null

describe "assetx filters", ->
  before ->
    app = { version: "3.0.x" }
    assetx = new Assetx(
      baseDir: __dirname
      outputDir: path.join(__dirname, "output")
      filters: [ "cssmin", "uglify" ]
    )
    assetx.attach app:app, (err) ->
      x = app.locals.x

  it "should compress js", ->
    out = x.script("res/foo.js")
    assert.isTrue out.indexOf("--") > 0
    filename = getResource(out)
    assert.isTrue isSingleLine(filename)
    assert.isTrue fileContains(filename, /t\.html/)


  it "should compile less", ->
    out = x.stylesheet("res/test.css")
    filename = getResource(out)
    assert.isTrue isSingleLine(filename)
    assert.isTrue out.indexOf("--") > 0
    assert.isTrue fileContains(filename, /red/)
