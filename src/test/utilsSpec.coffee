{assert} = require("./helper")
Utils = require("../lib/common/utils")

describe "Utils", ->
  describe "isBinary", ->
    it "should determine if a file is binary", ->
      assert.isTrue Utils.isFileBinary("#{__dirname}/res/favicon.ico")

    it "should determine if a file is text", ->
      assert.isFalse Utils.isFileBinary(__filename)

