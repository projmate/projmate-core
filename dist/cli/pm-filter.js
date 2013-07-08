/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Fs, Helpers, Logger, Path, Pkg, Program, Runner, Str, filterDescriptions, loadFilters, log, prettyPrint, printExamples, printProperties, run, runProject, _;

Program = require("commander");

Pkg = require("../../package.json");

Fs = require("fs");

Logger = require("../lib/common/logger");

Path = require("path");

log = Logger.getLogger("pm-filter");

Helpers = require("./helpers");

Str = require("underscore.string");

_ = require("lodash");

Runner = require("../lib/run/runner");

runProject = function(project, cb) {
  var program, runner;
  program = {};
  runner = new Runner({
    program: program
  });
  return runner.load(project, {
    cwd: __dirname
  }, function(err) {
    if (err) {
      console.error(err);
    }
    return cb();
  });
};

process.on("SIGINT", function() {
  var $;
  $ = require("projmate-shell");
  $.killAll();
  return process.reallyExit();
});

printProperties = function(names, properties, options) {
  var L, P, descriptions, len, name, o, property, type, _i, _len, _ref;
  if ((names != null ? names.length : void 0) < 1) {
    return;
  }
  console.log("  " + options.header + ":");
  console.log("");
  L = options.longestName;
  P = 0;
  for (name in properties) {
    property = properties[name];
    if (property.type === "array") {
      len = property.items.type.length + 2;
    } else {
      len = property.type.length;
    }
    if (len > P) {
      P = len;
    }
  }
  descriptions = [];
  _ref = names.sort();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    name = _ref[_i];
    o = properties[name];
    name = Str.sprintf("%-" + L + "s", name);
    if (o.type === "array") {
      type = "[]" + o.items.type;
    } else {
      type = o.type;
    }
    type = Str.sprintf("%-" + P + "s", type);
    descriptions.push(Str.sprintf("    %s %s %s", name, type, o.description));
  }
  return console.log(descriptions.join("\n"));
};

printExamples = function(schema) {
  var example, examples, first, line, _i, _len, _results;
  examples = schema.__.examples;
  if (!examples) {
    return;
  }
  console.log("\n  Examples:");
  console.log("");
  first = true;
  _results = [];
  for (_i = 0, _len = examples.length; _i < _len; _i++) {
    example = examples[_i];
    if (!first) {
      console.log("\n");
    }
    first = false;
    console.log("    * " + example.title + "\n");
    _results.push((function() {
      var _j, _len1, _ref, _results1;
      _ref = Str.lines(example.text);
      _results1 = [];
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        line = _ref[_j];
        _results1.push(console.log("      " + line));
      }
      return _results1;
    })());
  }
  return _results;
};

prettyPrint = function(filterName, Filter, options) {
  var L, keys, len, name, properties, property, schema, _ref;
  properties = [];
  console.log("");
  if (Filter.schema) {
    schema = Filter.schema;
    L = 0;
    _ref = schema.properties;
    for (name in _ref) {
      property = _ref[name];
      len = name.length;
      if (len > L) {
        L = len;
      }
    }
    console.log("  Filter: " + filterName + " - " + schema.title);
    console.log("");
    console.log("    " + schema.__.extnames + " -> " + (schema.__.outExtname ? schema.__.outExtname : '*'));
    console.log("");
    if (options.json) {
      console.log(JSON.stringify(schema, null, "  "));
    } else {
      keys = _(schema.properties).keys().sort().value();
      if (schema.required) {
        printProperties(schema.required, schema.properties, {
          longestName: L,
          header: 'Required Options'
        });
        console.log("");
        keys = _.difference(keys, schema.required);
      }
      printProperties(keys, schema.properties, {
        longestName: L,
        header: 'Optional Options'
      });
      printExamples(schema);
    }
  } else {
    console.log("" + filterName + " - No schema");
  }
  return console.log("");
};

run = function() {
  return loadFilters(function(err, Filters) {
    var Filter, e, k, name, v;
    if (err) {
      return log.error(err);
    }
    try {
      name = Program.args[0];
      for (k in Filters) {
        v = Filters[k];
        if (k.toLowerCase() === name.toLowerCase()) {
          name = k;
          Filter = v;
        }
      }
      if (Filter) {
        return prettyPrint(name, Filter, Program);
      } else {
        return log.error("Filter not found: " + name);
      }
    } catch (_error) {
      e = _error;
      return log.error(e);
    }
  });
};

loadFilters = function(cb) {
  var Filters, dummyProj;
  Filters = [];
  dummyProj = {
    project: function(pm) {
      Filters = pm.filterCollection._filterClasses;
      return {
        noop: 'does nothing'
      };
    }
  };
  return runProject(dummyProj, function(err) {
    return cb(err, Filters);
  });
};

/*
# Get filter descriptions
*/


filterDescriptions = function(cb) {
  return loadFilters(function(err, Filters) {
    var Filter, L, description, lines, name, _ref;
    if (err) {
      return cb(err);
    }
    lines = [];
    L = 0;
    for (name in Filters) {
      if (name.length > L) {
        L = name.length;
      }
    }
    for (name in Filters) {
      Filter = Filters[name];
      description = ((_ref = Filter.schema) != null ? _ref.title : void 0) != null ? Filter.schema.title : '';
      lines.push(Str.sprintf("    %-" + L + "s  %s", name, description));
    }
    return cb(null, lines.sort().join("\n"));
  });
};

Program.on("--help", function() {
  return filterDescriptions(function(err, descriptions) {
    if (err) {
      return log.error(err);
    } else {
      console.log("  Available Filters:");
      console.log("");
      return console.log(descriptions);
    }
  });
});

Program.version(Pkg.version).description("Prints information about a filter").usage("FILTER").option("-j, --json", "Print out JSON").parse(process.argv);

Program._name = 'pm filter';

if (process.argv.length < 3) {
  Program.outputHelp();
} else {
  run();
}
