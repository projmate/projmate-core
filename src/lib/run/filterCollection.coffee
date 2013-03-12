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



module.exports = FilterCollection
