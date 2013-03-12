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
Temp = require("temp")


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


# Fetch project from git or file system.
#
# @param {String} url
# @param {String} dirname
#
fetchProject = (url, dirname) ->
  if url.indexOf("file://") == 0
    url = S(url).chompLeft("file://").ensureRight("/").s
    log.info "Copying #{url} to #{dirname}"
    $.cp_rf url, dirname
  else
    $.exec "git clone #{url} #{dirname}"


# Clones a project skeleton from git repository or file system.
#
# @param {String} url
# @param {String} projectName
#
clone = (url, dirname, options, cb) ->
  if typeof options == 'function'
    cb = options
    options = {}

  fetchIt = ->
    if Fs.existsSync(dirname)
      opts =
        prompt: "Project #{dirname} exists. Overwrite? Type yes or"
        default: 'N'
      read opts, (err, result) ->
        if result == "yes"
          $.rm_rf dirname
          fetchProject(url, dirname)
        else
          cb("Project not created.")
    else
      fetchProject(url, dirname)

  # In multi-project repos, fetch EVERYTHING, then clone the subproject.
  if options.subProject
    # stage in temporary directory
    return temp.mkdir 'pm-create', (err, tempDir) ->
      fetchProject url, tempDir
      clone "file://" + Path.join(tempDir, options.subProject), dirname, cb
  else
    fetchIt()


# A project skeleton has a __meta.js file containing a single variable named
# `meta`. Simple functions, which can run in a restricted sandbox are allowed.
# However, these functions may rely on user input which occurs outside of the
# sandbox.
#
# The workaround is two-phase; first get inputs, then pass user's input
# values as the context for the functions within the sandbox.
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


# Gets input from user based on definitions in __meta.js
#
# @param {String} dirname
#
readSandboxedInputs = (dirname, cb) ->
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
    text = text.replace(new RegExp("\\{\\{pm__#{key}}}", "g"), value)
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
    readSandboxedInputs dirname, (err, readInputs) ->
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

