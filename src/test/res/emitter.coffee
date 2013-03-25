eventBus = require("../../lib/common/eventBus")
{defer} = require("when")

exports.publish = (message, data) ->
  setTimeout ->
    eventBus.emit message, data
  , 15

