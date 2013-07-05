/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var Create, Path, main, pkg, program;

pkg = require("../../package.json");

program = require("commander");

Create = require("../lib/create");

Path = require("path");

main = function() {
  program.url = program.args[0];
  program.project = program.args[1] || Path.basename(program.url);
  return Create.run(program);
};

program.on("--help", function() {
  return console.log("Examples:\n  Create pm-skeleton-jade from //github.com/projmate/skeleton-jade\n    pm create projmate/pm-skeleton-jade\n\n  Create my-project from //github.com/projmate/skeleton-jade\n    pm create projmate/skeleton-jade my-project");
});

program.version(pkg.version).description("Create a project from git repo skeleton").usage("url [dirname]").option("-s, --sub-project <dirname>", "Select sub project").option("-g, --git-init", "Initialize as git repo").parse(process.argv);

program._name = 'pm create';

if (program.args < 3) {
  program.outputHelp();
} else {
  main();
}
