{assert} = require("./helper")
eventBus = require("../lib/common/eventBus")
{defer, all} = require("when")
emitter = require("./res/emitter")

describe "EventBus", ->

  it "should receive events", (done) ->
    text = ""

    foo = defer()
    eventBus.on "foo", (data) ->
      text += data
      foo.resolve()

    bah = defer()
    eventBus.on "bah", (data) ->
      text += data
      bah.resolve()

    emitter.publish "foo", "bar"
    emitter.publish "bah", "baz"

    all [foo.promise, bah.promise], ->
      assert.isTrue text.indexOf("bar") > -1
      assert.isTrue text.indexOf("baz") > -1
      done()


