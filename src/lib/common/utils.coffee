Fs = require("fs")
Path = require("path")
Buffer = require('buffer').Buffer

# Get the encoding of a buffer (http://stackoverflow.com/questions/10225399/check-if-a-file-is-binary-or-ascii-with-node-js)
getEncoding = (buffer) ->
    # Prepare
    contentStartBinary = buffer.toString('binary',0,24)
    contentStartUTF8 = buffer.toString('utf8',0,24)
    encoding = 'utf8'

    # Detect encoding
    for i in [0...contentStartUTF8.length]
        charCode = contentStartUTF8.charCodeAt(i)
        if charCode is 65533 or charCode <= 8
            # 8 and below are control characters (e.g. backspace, null, eof, etc.)
            # 65533 is the unknown character
            encoding = 'binary'
            break

    # Return encoding
    return encoding

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
  #
  rensure: (s, str) ->
    if s[str.length - 1] == str
      s
    else
      s += str


  # Ensures a path uses unix convention.
  #
  # @example
  #   unixPath("c:\foo\bar.txt") == "c:/foo/bar.txt"
  #
  unixPath: (s) ->
    if Path.sep == "\\"
      s.replace /\\/g, "/"
    else
      s


  # Changes the extname of a filename.
  #
  # @param {String} filename
  # @param {String} extname The extension including leading dot.
  #
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


  # Determines if a file is binary.
  #
  # @param {String} filename
  #
  isFileBinary: (filename, cb) ->
    Fs.open filename, "r", (err, fd) ->
      return cb(err) if err
      buffer = new Buffer(24)

      Fs.read fd, buffer, 0, 24, 0, (err, num) ->
        return cb(err) if err
        Fs.close fd
        cb null, getEncoding(buffer) == "binary"


module.exports = Utils
