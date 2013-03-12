Path = require("path")
Async = require("async")
S = require("string")
Fs = require("fs")
$ = require("projmate-shell")
Utils = require("../common/utils")
read = require("read")
templayed = require("templayed")
Sandbox = require("sandbox")

log = require("../common/logger").getLogger("pm-create")
walkdir = require("walkdir")


# Gets the real URI for a project
#
# @examples
#   realUri("user/some-project") # git@github.com/user/some-project.git
#
realUri = (url) ->
  slashes = (url.match(/\//g) || []).length

  # projmate/projmate-skeleton-express
  if slashes == 1
    "git@github.com/#{url}.git"
  else
    url


# Clones a git repository.
#
# @param {String} url
# @param {String} projectName
#
clone = (url, dirname, force, cb) ->
  fetch = ->
    if url.indexOf("file://") == 0
      url = S(url).chompLeft("file://").ensureRight("/").s
      log.info "Copying #{url} to #{dirname}"
      $.cp_rf url, dirname
    else
      $.exec "git clone #{url} #{dirname}"
    cb()

  if Fs.existsSync(dirname)
    read prompt: "Project #{dirname} exists. Overwrite? Type yes or", default: 'N', (err, result) ->
      if result == "yes"
        $.rm_rf dirname
        fetch()
      else
        cb("Project not created.")
  else
    fetch()


# A project skeleton has a meta file with a single variable `meta`. To
# allow for richer meta fields, simple functions, which can run in
# a restricted sandbox are allowed. However, these functions sometimes require
# input from the user which is outside of the sandbox.
#
# The workaround is to first get inputs, then use the input values as
# the context for the functions within the sandbox.
#
sandbox = new Sandbox()
getMeta = (source, cb) ->
  source = """
  #{source};
  JSON.stringify(meta)
  """
  sandbox.run source, (output) ->
    try
      cb null, JSON.parse(S(output.result).chompLeft("'").chompRight("'").s)
    catch ex
      cb "Could not parse meta: " + ex.toString()

updateMeta = (source, inputs, cb) ->
  source = """
  #{source};
  var inputs = #{JSON.stringify(inputs)};
  for (var key in meta) {
    if (typeof(meta[key]) === 'function') {
      inputs[key] = meta[key].apply(inputs);
    }
  }
  JSON.stringify(inputs)
  """
  sandbox.run source, (output) ->
    try
      cb null, JSON.parse(S(output.result).chompLeft("'").chompRight("'").s)
    catch ex
      cb "Could not parse meta: " + ex.toString()


# Gets input from user using remote __meta.js
#
# @param {String} dirname
#
readProjectInput = (dirname, cb) ->
  metaFile = dirname + "/__meta.js"
  if !Fs.existsSync(dirname + "/__meta.js")
    return cb("Invalid project skeleton, `__meta.js` not found")

  # Run code in __meta.js in sandbox.
  projectName = Path.basename(dirname)
  meta = Fs.readFileSync(metaFile, "utf8")
  $.rm metaFile
  getMeta meta, (err, inputs) ->
    return console.error(err) if err

    Async.eachSeries Object.keys(inputs), (key, cb) ->
      opts = prompt: "Enter #{inputs[key]}: "
      opts.default = projectName if key == "project"

      read opts, (err, result) ->
        return cb(err) if err
        return cb("All inputs are required") if S(result).isEmpty()
        inputs[key] = result
        cb()
    , (err) ->
      return cb(err) if (err)
      updateMeta meta, inputs, cb


# Simple handlebars like template
#
# @example
#   template("hello {{name}}", {name: "foo"}) // "hello foo"
template = (text, locals) ->
  for key, value of locals
    text = text.replace(new RegExp("\\{\\{#{key}}}", "g"), value)
  text


# Create project from skeleton.
#
# @param {Object} options = {
#   {String} url The git url can be github short form "user/some-project".
#   {String} projectName The project name.
# }
#
exports.run = (options={}) ->
  return log.error("options.url is required") unless options.url
  url = realUri(options.url)
  dirname = options.project || process.cwd()
  inputs = {}

  fetchProject = (cb) ->
    clone url, dirname, options.force, cb

  readUserInput = (cb) ->
    readProjectInput dirname, (err, readInputs) ->
      inputs = readInputs
      cb err

  updateFileAndContentTemplates = (cb) ->
    # Walk directory deepest entries first
    Utils.walkDirSync dirname, true, (dirname, subdirs, files) ->
      for dir in subdirs
        path = Path.join(dirname, dir)
        if dir.indexOf("{{") >= 0
          newPath = Path.join(dirname, template(dir, inputs))
          $.mv path, newPath

      for file in files
        path = Path.join(dirname, file)
        if file.indexOf("{{") >= 0
          newPath = Path.join(dirname, template(file, inputs))
          $.mv path, newPath

        if !Utils.isFileBinary(path)
          content = Fs.readFileSync(path, "utf8")
          if content.indexOf("{{") >= 0
            content = template(content, inputs)
            Fs.writeFileSync path, content
    cb()

  Async.series [
    fetchProject
    readUserInput
    updateFileAndContentTemplates
  ], (err) ->
    return log.error(err) if err
    log.info "OK"

