var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

module.exports = function(Projmate) {
  var Aloha, schema, _ref;
  schema = {
    title: 'Aloha filter',
    type: 'object',
    __: {
      extnames: '*'
    }
  };
  return Aloha = (function(_super) {
    __extends(Aloha, _super);

    function Aloha() {
      _ref = Aloha.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Aloha.schema = schema;

    Aloha.prototype.process = function(asset, options, cb) {
      return cb(null, 'Aloha ' + asset.text);
    };

    return Aloha;

  })(Projmate.Filter);
};


/*
//@ sourceMappingURL=alohaFilter.map
*/