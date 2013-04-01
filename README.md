# Projmate core

The core for Projmate, a cross-platform, declarative and more intuitive
project administration.


## Motivation

I want files to be pretty, uncompressed and commented when I'm
developing, but in production I want the same files to be preprocessed,
minified, compressed and made into a single CommonJS module in the browser.

*   File sets - higher order than plugins
*   Build environments - development, test, production
*   Pipes and filters - how to process files in file sets
*   Rich, cross-platform shell object - works on Windows
*   Create projects - get started from a git repo skeleton
*   Serve files through local HTTP/HTTPS with valid certificate
*   CommonJS in the browser

## pm run

The following examples read `Projfile.coffee`

To build stylesheets in development mode

    pm run stylesheets

To build pages/stylesheets in production mode

    pm run pages stylesheets -e production

To build pages/stylesheets and watch

    pm run pages stylesheets --watch --serve

To build pages/stylesheets, watch and serve

    pm run pages stylesheets --watch --serve

Disable loading of files for mocha, etc

    files: { load: false }

Example

```coffee
#=== Projfile.coffee
exports.server =
  dirname: 'dist'
  httpPort: 8000 #80
  httpsPort: 8443

exports.project = (pm) ->
  f = pm.filters()
  $ = pm.shell()

  #  "src/**/*" => "dist/**/*"
  distDir = _filename: { replace: [/^src/, "dist"] }

  pm.registerTasks
    build:
      pre: "clean"
      files: "src/**/*"

      development: [
        f.coffee(bare: true)
        f.addHeader(filename: "doc/copyright.js")
        f.writeFile(distDir)
      ]

    clean:
      development: ->
        $.rm_rf "dist"

    tests:
      development: (cb) ->
        $.run "mocha -R spec --compilers coffee:coffee-script --globals PROJMATE src/test", cb
```

Note

*   Tasks define one or more build environment actions.

## Misc

TODO organize this README

To load an external Projfile with a namespace and set its work directory

    pm.load require(PATH), ns: 'server', cwd: __dirname+'/server'

To set the config level in the Projfile

    exports.config =
      log:
        level: 'info'

## pm create

Creating a project skeleton. Idea from [visionmedia/ngen]().

1.  Must have a top-level `__meta.js` file containing a single variable `meta`.
    The meta declares user inputs. All properties of type string are required
    input fields. Function properties, are evaluated after reading inputs
    from user. Functions are evaluated in a sandbox, KISS.

2.  Files and directories are renamed using `{{pm__PROPERTY}}` tokens. For
    example, given a file named `skeleton/{{pm__name}}.txt` and user input
    for `name` property is `"hello"`, the file is renamed to `skeleton\hello.txt`.

3.  Similarly, text files may use `{{pm__PROPERTY}}` for replacement during
    project creation.

The `{{pm__PROPERTY}}` convention was chosen due to popularity of mustachey
projects. Having to escape curly braces everywhere would not be fun.


### Projmate skeletons

    pm create <short-url> <new-project-name> [-s sub-project]

Short Url | Description
------------------------------|--------------------------------
projmate/skeletons            | Repository of several skeletons

Example

    pm create projmate/skeleton-backbone-spa bb-example


## License

Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>

See the file COPYING for copying permission.

