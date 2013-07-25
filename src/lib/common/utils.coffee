Fs = require("fs")
Path = require("path")
Buffer = require('buffer').Buffer
$ = require("projmate-shell")
globEx = require("./globEx")
_ = require('lodash')

# Get the encoding of a buffer (http://stackoverflow.com/questions/10225399/check-if-a-file-is-binary-or-ascii-with-node-js)
getEncoding = (buffer, count) ->
    # Prepare
    contentStartBinary = buffer.toString('binary', 0, count)
    contentStartUTF8 = buffer.toString('utf8', 0, count)
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

  glob: globEx

  Promises: require('./promises')

  $: $

  shell: $

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
  isFileBinary: (filename) ->
    fd = Fs.openSync(filename, "r")
    buffer = new Buffer(24)

    count = Fs.readSync(fd, buffer, 0, 24, 0)
    Fs.closeSync fd
    getEncoding(buffer, count - 1) == "binary"


  # Walks down a tree.
  #
  # @param start {String} Current directory relative to start direcotry.
  # @param deepestFirst {Boolean [optional]} Return deepest entries first.
  # @param callback {Function} Do work. Signature (dir, subdirs, subfiles, control)
  #        `dir` starts with `start`
  #        `subdirs` are relative to `dir`
  #        `subfiles` are relative to `dir`
  #        set control.stop = true from callback to stop recursing
  walkDirSync: (start, deepestFirst, callback) ->
    stat = Fs.statSync(start)

    if typeof arguments[1] == 'function'
      callback = arguments[1]
      deepestFirst = false

    if stat.isDirectory()
      filenames = Fs.readdirSync(start)

      coll = filenames.reduce (acc, name) ->
        abspath = Path.join(start, name)

        if Fs.statSync(abspath).isDirectory()
          acc.dirs.push(name)
        else
          acc.names.push(name)

        return acc
      , "names": [], "dirs": []

      control = {}
      if !deepestFirst
         callback start, coll.dirs, coll.names, control

      if not control.stop?
        coll.dirs.forEach (d) ->
          abspath = Path.join(start, d)
          Utils.walkDirSync abspath, deepestFirst, callback

      if deepestFirst
        callback start, coll.dirs, coll.names
    else
      throw new Error("path: " + start + " is not a directory")

  # Determines if target is older than source.
  #
  # @param target {String} Target path.
  # @param source {String} Reference path.
  outdated: (target, reference) ->
    return true if !Fs.existsSync(target)
    referenceStat = Fs.statSync(reference)
    targetStat = Fs.statSync(target)
    referenceStat.mtime.getTime() > targetStat.mtime.getTime()


  escapeRegExp: (str) ->
    str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")

  relativeToHome: (path) ->
    path.replace RegExp(Utils.escapeRegExp($.homeDir()), "i"), "~"

  relativeToCwd: (path, cwd=process.cwd()) ->
    path.replace RegExp(Utils.escapeRegExp(cwd), "i"), "."


  normalizeFiles: (config, prop) ->
    configFiles = config[prop]

    # Several short cuts to create a file set
    if configFiles
      # task:
      #   files: "foo/**/*.ext
      if typeof configFiles == "string"
        files = configFiles
        config[prop] = configFiles =
          include: [files]

      # task:
      #   files: ["foo/**/*.ext]
      if Array.isArray(configFiles)
        config[prop] = configFiles =
          include: configFiles

      # task:
      #   files:
      #     include: "foo/**/*.ext
      if typeof configFiles.include == "string"
        configFiles.include =  [configFiles.include]

      # check for exclusions
      if typeof configFiles.exclude == "string"
        configFiles.exclude = [configFiles.exclude]

      if !Array.isArray(configFiles.exclude)
        configFiles.exclude =  []

      removePatterns = []
      if Array.isArray(configFiles.include)
        for pattern in configFiles.include
          if pattern[0] == '!'
            removePatterns.push pattern
            excludePattern = pattern.slice(1)

            if excludePattern.match(/\/$/)
              configFiles.exclude.push excludePattern
              configFiles.exclude.push excludePattern + "/**/*"
            else
              configFiles.exclude.push excludePattern

      # remove exclusions
      configFiles.include = _.reject(configFiles.include, (pattern) -> removePatterns.indexOf(pattern) >= 0)



module.exports = Utils
