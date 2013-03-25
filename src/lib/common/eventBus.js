var EventEmitter = require("events").EventEmitter;
var util = require("util");

function EventBus() {

  this.className = "EventBus";
}
util.inherits(EventBus, EventEmitter);


module.exports = new EventBus();
