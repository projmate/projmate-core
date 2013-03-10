var pkg = require("./package.json");

module.exports = {
  _meta: {
    version: pkg.version,
    filename: __filename
  },
  cli: function() {
    require('./dist/cli/pm')
  },
  gui: function() {}
}
