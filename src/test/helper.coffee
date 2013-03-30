{assert, Assertion} = require("chai")
Assertion.includeStack = true
Runner = require("../lib/run/runner")
Logger = require("../lib/common/logger")

module.exports =
  assert: assert

  runProject: (project, program, cb) ->


    runner = new Runner(program: program)
    runner.load project, {cwd: __dirname}, (err) ->
      if err
        console.error err

      # Run the tasks
      runner.executeTasks program.tasks, (err) ->
        cb(err)

