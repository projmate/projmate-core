{assert} = require('./helper')
eventBus = require('../lib/common/eventBus')
Vow = require('vow')
emitter = require('./res/emitter')

describe 'EventBus', ->

  it 'should receive events', (done) ->
    text = ''

    foo = Vow.promise()
    eventBus.on 'foo', (data) ->
      text += data
      foo.fulfill()

    bah = Vow.promise()
    eventBus.on 'bah', (data) ->
      text += data
      bah.fulfill()

    emitter.publish 'foo', 'bar'
    emitter.publish 'bah', 'baz'

    Vow.all([foo, bah]).then ->
      assert.isTrue text.indexOf('bar') > -1
      assert.isTrue text.indexOf('baz') > -1
      done()


