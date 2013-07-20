exports.environmentAliases =
    development: ['development', 'dev']
    test: ['test', 'beta']
    production: ['production', 'release', 'prod']

exports.normalizeEnvironmentName = (name) ->
  for key, aliases of exports.environmentAliases
    if aliases.indexOf(name) > -1
      return name

  throw new Error("Run environment not recognized: #{name}")
