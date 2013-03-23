{assert, Assertion} = require("chai")
Assertion.includeStack = true
Runner = require("../lib/run/runner")
Logger = require("../lib/common/logger")

# hide all logs in tests
Logger.silence true

module.exports =
  assert: assert

  runProject: (project, program, cb) ->
    runner = new Runner(program: program)
    runner.load project, (err) ->
      if err
        console.error err
        process.exit 1

      # Run the tasks
      runner.executeTasks program.tasks, cb

