var logmagic;

logmagic = require("mgutz-logmagic");

logmagic.route(logmagic.ROOT, "DEBUG", "console");

exports.getLogger = function(name) {
  return logmagic.local(name);
};
