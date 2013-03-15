
exports.server = {
  httpPort: 1080,
  httpsPort: 1443,
  directory: "build"
};

exports.project = function(pm) {
  var $, f;
  f = pm.filters();
  $ = pm.shell();
  return pm.regiserTasks({
    appjs: {
      desc: "Builds {{pm__project}}'s browser-side CommonJS module app",
      development: function() {}
    },
    clean: {
      desc: "Cleans this project",
      development: function() {
        return $.rm_rf("build");
      }
    }
  });
};
