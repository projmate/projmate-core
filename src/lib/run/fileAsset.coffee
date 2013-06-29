Fs = require("fs")
Path = require("path")
mkdirp = require("mkdirp")
log = require("../common/logger").getLogger("FileAsset")
Utils = require("../common/utils")
Vow = require('vow')
eventBus = require("../common/eventBus")
Promises = require('../common/promises')


Function::property = (prop, desc) ->
  Object.defineProperty this.prototype, prop, desc


class FileAsset
  constructor: (options) ->
    {cwd, filename, parent, text, stat} = options
    throw new Error("parent property is required") unless options.parent?
    filename = Utils.unixPath(filename)
    @_filename = filename
    @originalFilename = filename
    @_extname = Path.extname(filename)
    @dirname = Path.dirname(filename)
    @basename = Path.basename(filename)
    @cwd = cwd
    @stat = stat
    @_text = text
    @parent = parent
    @writingPromises = []

  @property "filename",
    get: -> @_filename
    set: (fname) ->
      filename = Utils.unixPath(fname)
      @_filename = filename
      @_extname = Path.extname(filename)
      @dirname = Path.dirname(filename)
      @basename = Path.basename(filename)

  @property "text",
    get: -> @_text
    set: (text) -> @_text = text

  @property "extname",
    get: -> @_extname
    set: (ext) ->
      # adjust paths to use new extension
      @basename = Path.basename(@basename, @_extname) + ext
      @filename = Utils.unixPath(Path.join(@dirname, @basename))
      @_extname = ext

  toString: -> """
originalFilename: #{@originalFilename}
filename: #{@filename}
extname: #{@extname}
dirname: #{@dirname}
basename: #{@basename}
text: #{@text}
==============================================================================
"""


  read: (cb) ->
    Fs.readFile @filename, PROJMATE.encoding, cb

  # Gets a promise which is resolved right before the file is to be
  # written. The exact path is sometimes needed by filters. For example,
  # the coffee filter needs to know the final destination to set the
  # SourceMappingURL.
  whenWriting: (promise) ->
    @writingPromises.push promise

  write: (filename=@filename, cb) ->
    that = @
    Promises.parallel(@writingPromises).then ->
      text = that.text
      return cb() if text.length == 0
      mkdirp Path.dirname(filename), (err) ->
        return cb(err) if err
        Fs.writeFile filename, text, PROJMATE.encoding, (err) ->
          return cb(err) if err
          log.info "Wrote #{filename}"
          # livereload
          eventBus.emit "asset:written", that
          cb()
    .then null, (err) ->
      cb err

  # Determines if this asset is newer than `reference`
  newerThan: (reference) ->
    return true if !@stat
    return true if !Fs.existsSync(reference)
    referenceStat = Fs.statSync(reference)
    @stat.mtime.getTime() > referenceStat.mtime.getTime()

  @property "filterOptions",
    get: -> @__filterOptions
    set: (options) -> @__filterOptions = options

  # Merge options with next filter's op
module.exports = FileAsset

