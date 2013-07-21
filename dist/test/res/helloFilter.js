var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = function(Projmate) {
  var Hello, schema, _ref;
  schema = {
    title: 'Hello filter',
    type: 'object',
    __: {
      extnames: '*'
    }
  };
  return Hello = (function(_super) {
    __extends(Hello, _super);

    function Hello() {
      _ref = Hello.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Hello.schema = schema;

    Hello.prototype.process = function(asset, options, cb) {
      return cb(null, 'Hello ' + asset.text);
    };

    return Hello;

  })(Projmate.Filter);
};


/*
//@ sourceMappingURL=helloFilter.map
*/