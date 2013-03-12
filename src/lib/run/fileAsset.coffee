Fs = require("fs")
Path = require("path")
mkdirp = require("mkdirp")
log = require("../common/logger").getLogger("FileAsset")
Utils = require("../common/utils")

Function::property = (prop, desc) ->
  Object.defineProperty this.prototype, prop, desc


class FileAsset
  constructor: (options) ->
    {cwd, filename, parent, text} = options
    throw new Error("parent property is required") unless options.parent?
    filename = Utils.unixPath(filename)
    @filename = filename
    @originalFilename = filename
    @_extname = Path.extname(filename)
    @dirname = Path.dirname(filename)
    @basename = Path.basename(filename)
    @cwd = cwd
    @_text = text
    @parent = parent

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

  write: (filename=@filename, cb) ->
    text = @text
    return cb() if text.length == 0
    mkdirp Path.dirname(filename), (err) ->
      return cb(err) if err
      Fs.writeFile filename, text, PROJMATE.encoding, (err) ->
        return cb(err) if err
        log.info "Wrote #{filename}"
        cb()


module.exports = FileAsset

