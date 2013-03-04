Path = require("path")

Str =
  between: (s, startToken, endToken) ->
    startPos = s.indexOf(startToken)
    endPos = s.indexOf(endToken)
    start = startPos + startToken.length
    if endPos > startPos then s.slice(start, endPos) else ""

  # Remove chars from left side of string.
  lchomp: (s, substr) ->
    if ~s.indexOf(substr)
      s.slice(substr.length)
    else
      s

  # Ensure right side ends with a string.
  rensure: (s, str) ->
    if s[str.length - 1] == str
      s
    else
      s += str

  # Ensures a path uses unix convention.
  #
  # @example
  #   unixPath("c:\foo\bar.txt") == "c:/foo/bar.txt"
  unixPath: (s) ->
    if Path.sep == "\\"
      s.replace /\\/g, "/"
    else
      s



module.exports = Str
