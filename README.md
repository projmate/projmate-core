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
*   Rich, cross-platform shell object - works on Windows too
*   Create projects - get started from a git repo skeleton
*   Serve files through local HTTP/HTTPS with valid certificate
*   CommonJS in the browser (RequireJS also supported)
*   Components

## Examples

The following examples read `Projfile.coffee`

To build stylesheets in development mode

    pm run stylesheets

To build pages/stylesheets in production mode

    pm run pages stylesheets -e production

To build pages/stylesheets and watch

    pm run pages stylesheets --watch --serve

To build pages/stylesheets, watch and serve

    pm run pages stylesheets --watch --serve


```coffee
#=== Projfile.coffee

# Static server options (--serve)
exports.server =
  httpPort: 80
  httpsPort: 443
  dirname: "build"

# Tasks to run
exports.project = (pm) ->
  f = pm.filters()
  $ = pm.shell()

  writeToBuild = f.writeFiles(lchomp: "src", destinationDir: "build")

  pm.registerTasks
    appjs:
      _desc: "Build browser-compatible CommonJS module"
      _files:
        include: [
          "src/js/app_js/**/*.js"
          "src/js/app_js/**/*.coffee"
          "src/js/app_js/**/*.litcoffee"
        ]
      development: [
        f.coffee(bare: true)
        f.commonJsify(name: "app", baseDir: "src/js/app_js")
        writeToBuild
      ]
      production: [
        f.coffee(bare: true)
        f.commonJsify(name: "app", baseDir: "src/js/app_js")
        uglify
        f.addHeader(text: "/** Your web are belong to us */")
        f.compress
        writeToBuild
      ]

    pages:
      _desc: "Build pages from templates"
      _files:
        include: ["pages/**/*.jade"]

      development: [
        f.template(engine: "jade", $match: /jade$/)
        f.writeFiles(lchomp: "pages", destinationDir: "build")
      ]

    clean:
      _desc: "Cleans the project of all files that can be regenerated"
      development: ->
        $.rm "-rf", "build"

    all:
      _desc: "Runs everything"
      _pre: ["clean", "appjs", "pages"]
```

Note

*   Reserved task properties are prefixed with `_`, eg `_files`.
*   Tasks define one or more commands for build environments


## License

Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>

See the file COPYING for copying permission.

