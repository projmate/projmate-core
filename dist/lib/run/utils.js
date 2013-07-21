exports.environmentAliases = {
  development: ['development', 'dev'],
  test: ['test', 'beta'],
  production: ['production', 'release', 'prod']
};

exports.normalizeEnvironmentName = function(name) {
  var aliases, key, _ref;
  _ref = exports.environmentAliases;
  for (key in _ref) {
    aliases = _ref[key];
    if (aliases.indexOf(name) > -1) {
      return name;
    }
  }
  throw new Error("Run environment not recognized: " + name);
};


/*
//@ sourceMappingURL=utils.map
*/