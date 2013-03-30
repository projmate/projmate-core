logmagic = require("mgutz-logmagic")
eyes = require('eyes')

inspect = eyes.inspector
  styles:
    all: 'red',
    special: 'bold'
  maxLength: 1024


logmagic.setSinkOptions "console", timestamp: ->
  d = new Date

  # pad
  pad2 = (n) -> if n < 10 then '0' + n else n

  pad3 = (n) ->
    if n > 99
      n
    else if n > 9
      '0' + n
    else
      '00' + n

  pad2(d.getHours())        + ':' +
  pad2(d.getMinutes())      + ':' +
  pad2(d.getSeconds())      + '.' +
  pad3(d.getMilliseconds())


logmagic.registerSink "nullLogger", ->

exports.getLogger = (name) ->
  logger = logmagic.local(name)
  logger.inspect = inspect
  logger

exports.silence = (silent) ->
  if silent
    logmagic.route logmagic.ROOT, "ERROR", "nullLogger"
  else
    logmagic.route logmagic.ROOT, "DEBUG", "console"

exports.silence false


