_ = require("lodash")
Filter = require("./filter")
Projmate = require("..")

# Manages filters.
#
class FilterCollection

  constructor: ->
    # factory functions
    @filters = {}


  # Loads built-in filters.
  #
  # @param {String} dirname The directory path.
  #
  loadPackage: (packageName) ->
    that = @

    modules = require(packageName)
    for name, classFactory of modules
      FilterClass = classFactory(Projmate)

      do (name, FilterClass) ->
        # ensure it is a filter
        filter = new FilterClass
        if not filter instanceof Filter
          throw new Error("Invalid filter #{packageName}.#{name}")

        # Wrap the real filter in a wrapper so the filter may
        # be used without parentheses. The task executor must check
        # to see if the filter is a wrapper and if so invoke it as a function
        # to get the instance.
        #
        # {Object} processOptions Passed to process.
        # {Object} config Passed to constructor
        #
        # allows simple syntax, e.g. f.coffee({bare: true}, {extnames: ['.coffee', '.funcd']})
        that.filters[name] = (processOptions={}, config={}) ->
          instance = new FilterClass(name, config, processOptions)

          if processOptions.$addExtname
            newext = processOptions.$addExtname
            extnames = instance.extname
            extnames = [extnames] unless Array.isArray(extnames)
            if extnames.indexOf("*") < 0 and extnames.indexOf(newext) < 0
              extnames.push newext
              instance.extname = extnames

          instance

        # even though this is a function, we can still attach a property
        # which is later used to determine if the pipeline starts with a loader
        that.filters[name].isAssetLoader = filter.isAssetLoader


module.exports = FilterCollection
