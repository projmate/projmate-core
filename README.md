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

    pm create <short-url> <projmate-project-name>

Short Url | Description
------------------------------|--------------------------
projmate/skeleton-backbone-spa | Backbone example
projmate/skeleton-filter | Create a filter
projmate/skeleton-task | Create a task processor
projmate/skeleton-skeleton | Create your own skeleton

Example

    pm create projmate/skeleton-backbone-spa bb-example


## License

Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>

See the file COPYING for copying permission.

