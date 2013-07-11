_ = require("lodash")
Filter = require("./filter")
Projmate = require("..")

# Manages filters.
#
class FilterCollection

  constructor: ->
    # In projfiles, filters are actually factories which create instances
    # of a FilterClass
    @factories = {}

    @_filterClasses = {}

  loadPackage: (packageName) ->

    modules = require(packageName)
    @loadFromObject modules

  # Loads built-in filters.
  #
  # @param {String} dirname The directory path.
  #
  loadFromObject: (obj) ->
    that = @

    for name, classFactory of obj
      FilterClass = classFactory(Projmate)

      do (name, FilterClass) ->
        schema = FilterClass.schema
        if !schema?.__?
          throw new Error("Invalid filter `#{packageName}.#{name}`: schema.__ is required")
        if !schema.title
          throw new Error("Invalid filter `#{packageName}.#{name}`: schema.title is required")
        if !schema.__.extnames
          throw new Error("Invalid filter `#{packageName}.#{name}`: schema.__.extnames is required")

        # ensure it is a filter
        filter = new FilterClass

        if not filter instanceof Filter
          throw new Error("Invalid filter #{packageName}.#{name}")

        # External utilities read the schema from the real filter instead
        # of the factory
        that._filterClasses[name] = FilterClass

        # Wrap the real filter in a factory so the filter may
        # be used without parentheses. The task executor must check
        # to see if the filter is a wrapper and if so invoke it as a function
        # to get the instance.
        #
        # To check if it is a filter `factory._process?`
        #
        # {Object} processOptions Passed to process.
        # {Object} config Passed to constructor
        #
        # allows simple syntax, e.g. f.coffee({bare: true}, {extnames: ['.coffee', '.funcd']})
        that.factories[name] = (processOptions={}, config={}) ->
          instance = new FilterClass(name, config, processOptions)

          # The contains a section which is not to be validated but used by
          # Projmate. It has special proeprty name of `__`
          for prop in ['extnames', 'outExtname', 'isAssetLoader', 'defaults', 'useLoader']
            val = schema['__'][prop]
            instance[prop] = val if val?

          instance.extnames = [instance.extnames] unless Array.isArray(instance.extnames)

          if processOptions.$addExtname
            newext = processOptions.$addExtname
            extnames = instance.extname
            extnames = [extnames] unless Array.isArray(extnames)
            if extnames.indexOf("*") < 0 and extnames.indexOf(newext) < 0
              extnames.push newext
              instance.extname = extnames

          instance

        # even though this is a function, we can still attach a property to it
        # sometimes we need things from the schema like determining which asset loader
        # to user
        that.factories[name].schema = FilterClass.schema


module.exports = FilterCollection
