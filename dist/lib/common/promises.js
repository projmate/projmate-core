/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

Vow = require('vow');

var Promises = function() {
  this.promises = [];
};

Promises.prototype.cb = function() {
  var promise = Vow.promise();
  this.promises.push(promise);
  return promise.cb;
};

Promises.prototype.all = function() {
  return Vow.all(this.promises);
};

module.exports = Promises;
