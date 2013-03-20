{assert, runProject} = require("./helper")


describe "Tasks", ->

  describe "Order and Dependecies", ->

    it "should do simple task", (done) ->
      name = ""
      project = (pm) ->
        hello:
          desc: "hello"
          development: ->
            name = "foo"

      runProject project, tasks: ["hello"], (err) ->
        assert.ifError err
        assert.equal name, "foo"
        done()

    it "should run multiple tasks", (done) ->
      ran = ""
      project = (pm) ->
        a:
          development: -> ran += "a"
        b:
          development: -> ran += "b"

      runProject project, tasks: ["a", "b"], (err) ->
        assert.ifError err
        assert.equal ran, "ab"
        done()


    it "should run dependencies", (done) ->
      total = 100
      project = (pm) ->
        add:
          pre: "reset"
          development: ->
            total += 10
        reset:
          development: -> total = 0

      runProject project, tasks: ["add"], (err) ->
        assert.ifError err
        assert.equal total, 10
        done()


    it "should run tasks only once", (done) ->
      ran = ""
      project = (pm) ->
        a:
          pre: ["b", "c"]
          development: -> ran += "a"

        b:
          development: -> ran += "b"

        c:
          pre: "b"     # this should not get called again
          development: -> ran += "c"

      runProject project, tasks: ["a"], (err) ->
        assert.ifError err
        assert.equal ran, "bca"
        done()


    it "should run async/sync", (done) ->
      ran = ""
      project = (pm) ->
        a:
          pre: ["b", "c"]
          development: -> ran += "a"
        b:
          development: (done) ->
            setTimeout ->
              ran += "b"
              done()
            , 100
        c:
          pre: "b"     # this should not get called again
          development: -> ran += "c"

      runProject project, tasks: ["a"], (err) ->
        assert.ifError err
        assert.equal ran, "bca"
        done()


  describe "Build Environments", ->
    it "should default to development", (done) ->
      ran = ""
      project = (pm) ->
        a:
          pre: ["b", "c"]
          development: -> ran += "aD"
          test: -> ran += "aT"
        b:
          development: (done) ->
            setTimeout ->
              ran += "bD"
              done()
            , 100
          production: -> ran += "bP"
        c:
          pre: "b"     # this should not get called again
          development: -> ran += "cD"

      runProject project, tasks: ["a"], environment: "production", (err) ->
        assert.ifError err
        assert.equal ran, "bPcDaD"
        done()





