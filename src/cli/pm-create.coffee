pkg = require("../../package.json")
program = require("commander")
create = require("../lib/pm-create")
Path = require("path")

# Runs the server
#
main = ->
  program.url = program.args[0]
  program.project = program.args[1] || Path.basename(program.url)
  create.run program


# Configure program arguments.
#
program.on "--help", ->
  console.log """
  Examples:

    Create pm-skeleton-jade from //github.com/projmate/skeleton-jade
      pm create projmate/pm-skeleton-jade

    Create my-project from //github.com/projmate/skeleton-jade
      pm create projmate/skeleton-jade my-project
  """

program
  .version(pkg.version)
  .description("Create a project from git repo skeleton")
  .usage("url [dirname]")
  .option("-g, --git-init", "Initialize as git repo")
  .parse(process.argv)

if program.args < 3
  program.outputHelp()
else
  main()
