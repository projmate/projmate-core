/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var all, assert, defer, emitter, eventBus, _ref;

assert = require("./helper").assert;

eventBus = require("../lib/common/eventBus");

_ref = require("when"), defer = _ref.defer, all = _ref.all;

emitter = require("./res/emitter");

describe("EventBus", function() {
  return it("should receive events", function(done) {
    var bah, foo, text;

    text = "";
    foo = defer();
    eventBus.on("foo", function(data) {
      text += data;
      return foo.resolve();
    });
    bah = defer();
    eventBus.on("bah", function(data) {
      text += data;
      return bah.resolve();
    });
    emitter.publish("foo", "bar");
    emitter.publish("bah", "baz");
    return all([foo.promise, bah.promise], function() {
      assert.isTrue(text.indexOf("bar") > -1);
      assert.isTrue(text.indexOf("baz") > -1);
      return done();
    });
  });
});


/*
//@ sourceMappingURL=eventBusSpec.map
*/