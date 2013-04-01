{assert, runProject} = require("./helper")


describe "Tasks", ->

  describe "Order and Dependecies", ->

    it "should do simple task", (done) ->
      name = ""
      project =
        project: (pm) ->
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
      project =
        project: (pm) ->
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
      project =
        project: (pm) ->
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
      project =
        project: (pm) ->
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
      project =
        project: (pm) ->
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
      project =
        project: (pm) ->
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



  describe "Namespaced tasks", ->
    it "should use default or empty namespace by default", (done) ->
      ran = ""

      other =
        project: (pm) ->
          d:
            pre: ["e"]
            dev: -> ran += "d'D"
          e:
            dev: -> ran += "e'D"

      project =
        project: (pm) ->
          pm.load other

          a:
            pre: ["b", "c"]
            dev: -> ran += "aD"
            test: -> ran += "aT"
          b:
            development: (done) ->
              setTimeout ->
                ran += "bD"
                done()
              , 100
            prod: -> ran += "bP"
          c:
            pre: "b"     # this should not get called again
            dev: -> ran += "cD"

      runProject project, tasks: ["a", "d"], environment: "production", (err) ->
        assert.ifError err
        assert.equal ran, "bPcDaDe'Dd'D"
        done()

    it 'should use namespace even if only loading', (done) ->
      ran = ""

      other =
        project: (pm) ->
          d:
            pre: ["e"]
            dev: -> ran += "d'D"
          e:
            dev: -> ran += "e'D"

      project =
        project: (pm) ->
          pm.load other, ns: "dopey"

      runProject project, tasks: ["dopey:d"], environment: "production", (err) ->
        assert.ifError err
        assert.equal ran, "e'Dd'D"
        done()


    it "should use namespace", (done) ->
      ran = ""

      other =
        project: (pm) ->
          d:
            pre: ["e"]
            dev: -> ran += "d'D"
          e:
            dev: -> ran += "e'D"

      project =
        project: (pm) ->
          pm.load other, ns: "dopey"
          pm.load other, ns: "sleepy"

          a:
            pre: ["b", "c"]
            dev: -> ran += "aD"
            test: -> ran += "aT"
          b:
            development: (done) ->
              setTimeout ->
                ran += "bD"
                done()
              , 100
            prod: -> ran += "bP"
          c:
            pre: "b"     # this should not get called again
            dev: -> ran += "cD"

      runProject project, tasks: ["a", "dopey:d", "sleepy:e"], environment: "production", (err) ->
        assert.ifError err
        assert.equal ran, "bPcDaDe'Dd'De'D"
        done()


    describe "Sugar", ->
      it "can be all dependencies", (done) ->
        ran = ""
        project =
          project: (pm) ->
            all: ["b", "c"]
            b:
              dev: (done) ->
                setTimeout ->
                  ran += "bD"
                  done()
                , 1
              prod: -> ran += "bP"
            c:
              pre: "b"     # this should not get called again
              dev: -> ran += "cD"

        runProject project, tasks: ["all"], environment: "production", (err) ->
          assert.ifError err
          assert.equal ran, "bPcD"
          done()





