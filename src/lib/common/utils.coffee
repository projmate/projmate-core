Fs = require("fs")
Path = require("path")

Utils =

  # Finds string between strtToken and endToken
  #
  between: (s, startToken, endToken) ->
    startPos = s.indexOf(startToken)
    endPos = s.indexOf(endToken)
    start = startPos + startToken.length
    if endPos > startPos then s.slice(start, endPos) else ""


  # Remove chars from left side of string.
  #
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


  # Changes the extname of a filename.
  #
  # @param {String} filename
  # @param {String} extname The extension including leading dot.
  changeExtname: (filename, extname) ->
    filename.replace /\.\w+$/, extname


  # Finds dir from current and up containing file `basename`
  #
  # @param basename
  # @param dir
  # @returns {*}
  #
  findDirUp: (basename, dir=process.cwd()) ->
    return dir if Fs.existsSync(Path.join(dir, basename))
    parent = Path.normalize(Path.join(dir, ".."))
    if parent != dir
      return Utils.findDirUp(basename, parent)
    else
      return null


module.exports = Utils
