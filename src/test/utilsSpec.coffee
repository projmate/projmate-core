{assert} = require("./helper")
Utils = require("../lib/common/utils")

describe "Utils", ->
  describe "isBinary", ->
    it "should determine if a file is binary", (done) ->
      Utils.isFileBinary "#{__dirname}/res/favicon.ico", (err, isBinary) ->
        assert.isTrue isBinary
        done()

    it "should determine if a file is text", (done) ->
      Utils.isFileBinary __filename, (err, isBinary) ->
        assert.isFalse isBinary
        done()

