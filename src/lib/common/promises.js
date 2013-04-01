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


Promises.parallel = function(arr) {
  var item;
  for (var i = 0, L = arr.length; i < L; i++) {
    item = arr[i];
    if (typeof item === 'function')
      arr[i] = item();
  }
  return Vow.all(arr);
}

module.exports = Promises;
