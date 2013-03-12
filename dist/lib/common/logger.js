/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var logmagic;

logmagic = require("mgutz-logmagic");

logmagic.route(logmagic.ROOT, "DEBUG", "console");

exports.getLogger = function(name) {
  return logmagic.local(name);
};
