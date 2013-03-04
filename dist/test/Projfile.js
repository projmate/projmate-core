// Generated by CoffeeScript 1.5.0
(function() {

  exports.project = function(pm) {
    var addHeader, f, sh, writeToBuildDir;
    f = pm.filters();
    sh = pm.shell();
    writeToBuildDir = f.writeFile({
      lchomp: "test/res",
      destinationDir: "test/build"
    });
    addHeader = f.functoid({
      name: "foo",
      process: function(asset, options) {
        return "// Copyright " + options.name + "\n" + asset.text;
      }
    });
    return pm.registerTasks({
      stylesheets: {
        _pre: ["res"],
        _files: {
          include: ["test/res/test.less"]
        },
        development: [
          f.less({
            dumpLineNumbers: "comments"
          }), writeToBuildDir
        ],
        production: [f.less, writeToBuildDir]
      },
      scripts: {
        _pre: ["res"],
        _files: {
          include: ["test/res/foo_js/**/*.coffee", "test/res/foo_js/**/*.js"]
        },
        development: [
          f.coffee, f.commonJsify({
            baseDir: "test/res/foo_js",
            moduleName: "myapp",
            filename: "test/res/myapp.js"
          }), addHeader, writeToBuildDir
        ]
      },
      clean: {
        development: function() {
          sh.rm("-rf", "test/build");
          return sh.rm("-rf", "test/res");
        }
      },
      res: {
        _pre: ["clean"],
        development: function() {
          sh.mkdir("-p", "test/res");
          return sh.cp("-rf", "src/test/res/*", "test/res");
        }
      }
    });
  };

}).call(this);
