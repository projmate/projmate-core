/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var logmagic;

logmagic = require("mgutz-logmagic");

logmagic.route(logmagic.ROOT, "DEBUG", "console");

logmagic.setSinkOptions("console", {
  timestamp: function() {
    var d, pad2, pad3;
    d = new Date;
    pad2 = function(n) {
      if (n < 10) {
        return '0' + n;
      } else {
        return n;
      }
    };
    pad3 = function(n) {
      if (n > 99) {
        return n;
      } else if (n > 9) {
        return '0' + n;
      } else {
        return '00';
      }
    };
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()) + '.' + pad3(d.getMilliseconds());
  }
});

exports.getLogger = function(name) {
  return logmagic.local(name);
};
