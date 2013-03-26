/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var defer, eventBus;

eventBus = require("../../lib/common/eventBus");

defer = require("when").defer;

exports.publish = function(message, data) {
  return setTimeout(function() {
    return eventBus.emit(message, data);
  }, 15);
};


/*
//@ sourceMappingURL=emitter.map
*/