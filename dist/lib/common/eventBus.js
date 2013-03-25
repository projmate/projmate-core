/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var EventEmitter = require("events").EventEmitter;
var util = require("util");

function EventBus() {

  this.className = "EventBus";
}
util.inherits(EventBus, EventEmitter);


module.exports = new EventBus();
