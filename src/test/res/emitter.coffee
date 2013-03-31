eventBus = require('../../lib/common/eventBus')

exports.publish = (message, data) ->
  setTimeout ->
    eventBus.emit message, data
  , 15

