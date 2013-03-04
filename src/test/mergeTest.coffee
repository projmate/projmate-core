assert = require("chai").assert
Assetx = require("..")
path = require("path")
{getResource, fileContains} = require("./helpers")

x = null

describe "assetx merge", ->
  before ->
    app = { version: "3.0.x" }
    assetx = new Assetx(baseDir: __dirname, outputDir: path.join(__dirname, 'output'), merge: true)
    assetx.attach app:app, (err) ->
      x = app.locals.x

  it "should compile and merge scripts", ->
    out = x.script("res/test.js res/foo.js")
    filename = getResource(out)
    assert.isTrue out.indexOf(".js") > 0
    assert.isTrue fileContains(filename, /var sum.+\n.*this\.require/)
