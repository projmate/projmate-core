Path = require("path")
$ = require("projmate-shell")
async = require("async")
log = require("../common/logger").getLogger("pm-create")
walkdir = require("walkdir")
S = require("string")

strcount = (s, needle) ->
  s.match


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
clone = (url, dirname) ->
  if url.indexOf("file://")
    url = S(url).chompLeft("file://").s
    $.cp_rf url, dirname
  else
    $.exec "git clone #{url} #{dirname}"


# Gets input from user
#
# @param {String} dirname
#
readProjectInput = (dirname, cb) ->
  jsonFile = dirname + "/projmate.json"
  if !Fs.existsSync(dirname + "/projmate.json")
    throw new Error("Invalid project skeleton, `projmate.json` not found")

  # Allow users to use the current directory name as part of the prompt
  projectName = Path.basename(dirname)
  json = Fs.readFileSync(jsonFile)
  json = json.replace(/\{\{dirname}}/g, projectName)

  inputs = JSON.parse(json)
  async.eachSeries Object.keys(inputs), (key, cb) ->
    opts = prompt: inputs[key]
    opts.default = projectName if key == "project"

    read prompt:prompt, (err, result) ->
      return cb(err) if err
      inputs[key] = result
  , (err) ->
    return cb(err) if (err)
    cb null, inputs


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

  clone url, dirname
  readProjectInput dirname, (err, inputs) ->
    return log.error(err) if err

    walkdir dirname, (path, stat) ->
      if stat.isDirectory()
        console.log "directory: #{path}"
      else
        console.log "file: #{path}"

