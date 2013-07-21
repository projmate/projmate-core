var eventBus;

eventBus = require('../../lib/common/eventBus');

exports.publish = function(message, data) {
  return setTimeout(function() {
    return eventBus.emit(message, data);
  }, 15);
};


/*
//@ sourceMappingURL=emitter.map
*/