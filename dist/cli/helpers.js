var Fs, Path;

Path = require("path");

Fs = require("fs");

/*
# Finds project file.
#
# @returns Returns the full path to found projec file.
*/


exports.findProjfile = function(program) {
  var file, files, projfile, _i, _len;
  files = [program.projfile, "Projfile.js", "Projfile.coffee"];
  for (_i = 0, _len = files.length; _i < _len; _i++) {
    file = files[_i];
    if (!((file != null ? file.length : void 0) > 0)) {
      continue;
    }
    projfile = Path.resolve(file);
    if (Fs.existsSync(projfile)) {
      return projfile;
    }
  }
  if (program.projfile) {
    throw new Error("Projfile not found: " + program.projfile);
  } else {
    throw new Error("Projfile not found in " + (process.cwd()) + " or any of its parent directories");
  }
  return null;
};


/*
//@ sourceMappingURL=helpers.map
*/