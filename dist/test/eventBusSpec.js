/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Vow, assert, emitter, eventBus;

assert = require('./helper').assert;

eventBus = require('../lib/common/eventBus');

Vow = require('vow');

emitter = require('./res/emitter');

describe('EventBus', function() {
  return it('should receive events', function(done) {
    var bah, foo, text;

    text = '';
    foo = Vow.promise();
    eventBus.on('foo', function(data) {
      text += data;
      return foo.fulfill();
    });
    bah = Vow.promise();
    eventBus.on('bah', function(data) {
      text += data;
      return bah.fulfill();
    });
    emitter.publish('foo', 'bar');
    emitter.publish('bah', 'baz');
    return Vow.all([foo, bah]).then(function() {
      assert.isTrue(text.indexOf('bar') > -1);
      assert.isTrue(text.indexOf('baz') > -1);
      return done();
    });
  });
});
