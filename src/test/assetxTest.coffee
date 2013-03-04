assert = require("chai").assert
Assetx = require("..")
path = require("path")
{getResource, fileContains} = require("./helpers")

x = null

describe "assetx", ->
  before ->
    app = { version: "3.0.x" }
    assetx = new Assetx(baseDir: __dirname, outputDir: path.join(__dirname, 'output'))
    assetx.attach app:app, (err) ->
      x = app.locals.x

  it "should compile coffee", ->
    out = x.script("res/test.js")
    filename = getResource(out)
    assert.isTrue out.indexOf("--") > 0
    assert.isTrue fileContains(filename, /var sum/)

  it "should passthrough unknown extension", ->
    out = x.script("res/test.txt")
    filename = getResource(out)
    assert.isTrue out.indexOf("--") > 0
    assert.isTrue fileContains(filename, /plaintext/)

  it "should compile less", ->
    out = x.stylesheet("res/test.css")
    filename = getResource(out)
    assert.isTrue out.indexOf("--") > 0
    assert.isTrue fileContains(filename, /red/)

  it "should compile stitch directory", ->
    out = x.script("res/foo.js")
    assert.isTrue out.indexOf("--") > 0
    filename = getResource(out)
    assert.isTrue fileContains(filename, /var s/)
    assert.isTrue fileContains(filename, /t\.html\(\)/)

  it "should compile funcd", ->
    out = x.stylesheet("res/funcd.html")
    assert.isTrue out.indexOf("--") > 0
    filename = getResource(out)
    assert.isTrue fileContains(filename, /<body>/)

  it "should compile stylus", ->
    out = x.stylesheet("res/stylus.css")
    assert.isTrue out.indexOf("--") > 0
    filename = getResource(out)
    assert.isTrue fileContains(filename, /padding:10px 5px/)
