fs = require("fs")
path = require("path")
str = require("underscore.string")

module.exports =

  # Gets resource filename.
  getResource: (element) ->
    element.match(///(href|src)='([^']+)'///)[2]


   # Determines if a `filename` contains `pattern`.
  fileContains: (filename, pattern) ->
    filename = path.join(__dirname, filename)
    content = fs.readFileSync(filename, 'utf8')
    !!content.match(pattern)

  # Determines if `filename` is a single line.
  isSingleLine: (filename) ->
    filename = path.join(__dirname, filename)
    content = fs.readFileSync(filename, 'utf8')
    str.count(content, "\n")  == 0
