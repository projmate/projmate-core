/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var assert, runProject, _ref;

_ref = require("./helper"), assert = _ref.assert, runProject = _ref.runProject;

describe("Tasks", function() {
  describe("Order and Dependecies", function() {
    it("should do simple task", function(done) {
      var name, project;

      name = "";
      project = {
        project: function(pm) {
          return {
            hello: {
              desc: "hello",
              development: function() {
                return name = "foo";
              }
            }
          };
        }
      };
      return runProject(project, {
        tasks: ["hello"]
      }, function(err) {
        assert.ifError(err);
        assert.equal(name, "foo");
        return done();
      });
    });
    it("should run multiple tasks", function(done) {
      var project, ran;

      ran = "";
      project = {
        project: function(pm) {
          return {
            a: {
              development: function() {
                return ran += "a";
              }
            },
            b: {
              development: function() {
                return ran += "b";
              }
            }
          };
        }
      };
      return runProject(project, {
        tasks: ["a", "b"]
      }, function(err) {
        assert.ifError(err);
        assert.equal(ran, "ab");
        return done();
      });
    });
    it("should run dependencies", function(done) {
      var project, total;

      total = 100;
      project = {
        project: function(pm) {
          return {
            add: {
              pre: "reset",
              development: function() {
                return total += 10;
              }
            },
            reset: {
              development: function() {
                return total = 0;
              }
            }
          };
        }
      };
      return runProject(project, {
        tasks: ["add"]
      }, function(err) {
        assert.ifError(err);
        assert.equal(total, 10);
        return done();
      });
    });
    it("should run tasks only once", function(done) {
      var project, ran;

      ran = "";
      project = {
        project: function(pm) {
          return {
            a: {
              pre: ["b", "c"],
              development: function() {
                return ran += "a";
              }
            },
            b: {
              development: function() {
                return ran += "b";
              }
            },
            c: {
              pre: "b",
              development: function() {
                return ran += "c";
              }
            }
          };
        }
      };
      return runProject(project, {
        tasks: ["a"]
      }, function(err) {
        assert.ifError(err);
        assert.equal(ran, "bca");
        return done();
      });
    });
    return it("should run async/sync", function(done) {
      var project, ran;

      ran = "";
      project = {
        project: function(pm) {
          return {
            a: {
              pre: ["b", "c"],
              development: function() {
                return ran += "a";
              }
            },
            b: {
              development: function(done) {
                return setTimeout(function() {
                  ran += "b";
                  return done();
                }, 100);
              }
            },
            c: {
              pre: "b",
              development: function() {
                return ran += "c";
              }
            }
          };
        }
      };
      return runProject(project, {
        tasks: ["a"]
      }, function(err) {
        assert.ifError(err);
        assert.equal(ran, "bca");
        return done();
      });
    });
  });
  describe("Build Environments", function() {
    return it("should default to development", function(done) {
      var project, ran;

      ran = "";
      project = {
        project: function(pm) {
          return {
            a: {
              pre: ["b", "c"],
              development: function() {
                return ran += "aD";
              },
              test: function() {
                return ran += "aT";
              }
            },
            b: {
              development: function(done) {
                return setTimeout(function() {
                  ran += "bD";
                  return done();
                }, 100);
              },
              production: function() {
                return ran += "bP";
              }
            },
            c: {
              pre: "b",
              development: function() {
                return ran += "cD";
              }
            }
          };
        }
      };
      return runProject(project, {
        tasks: ["a"],
        environment: "production"
      }, function(err) {
        assert.ifError(err);
        assert.equal(ran, "bPcDaD");
        return done();
      });
    });
  });
  return describe("Namespaced tasks", function() {
    it("should use default or empty namespace by default", function(done) {
      var other, project, ran;

      ran = "";
      other = {
        project: function(pm) {
          return {
            d: {
              pre: ["e"],
              dev: function() {
                return ran += "d'D";
              }
            },
            e: {
              dev: function() {
                return ran += "e'D";
              }
            }
          };
        }
      };
      project = {
        project: function(pm) {
          pm.load(other);
          return {
            a: {
              pre: ["b", "c"],
              dev: function() {
                return ran += "aD";
              },
              test: function() {
                return ran += "aT";
              }
            },
            b: {
              development: function(done) {
                return setTimeout(function() {
                  ran += "bD";
                  return done();
                }, 100);
              },
              prod: function() {
                return ran += "bP";
              }
            },
            c: {
              pre: "b",
              dev: function() {
                return ran += "cD";
              }
            }
          };
        }
      };
      return runProject(project, {
        tasks: ["a", "d"],
        environment: "production"
      }, function(err) {
        assert.ifError(err);
        assert.equal(ran, "bPcDaDe'Dd'D");
        return done();
      });
    });
    return it("should use namespace", function(done) {
      var other, project, ran;

      ran = "";
      other = {
        project: function(pm) {
          return {
            d: {
              pre: ["e"],
              dev: function() {
                return ran += "d'D";
              }
            },
            e: {
              dev: function() {
                return ran += "e'D";
              }
            }
          };
        }
      };
      project = {
        project: function(pm) {
          pm.load(other, "dopey");
          pm.load(other, "sleepy");
          return {
            a: {
              pre: ["b", "c"],
              dev: function() {
                return ran += "aD";
              },
              test: function() {
                return ran += "aT";
              }
            },
            b: {
              development: function(done) {
                return setTimeout(function() {
                  ran += "bD";
                  return done();
                }, 100);
              },
              prod: function() {
                return ran += "bP";
              }
            },
            c: {
              pre: "b",
              dev: function() {
                return ran += "cD";
              }
            }
          };
        }
      };
      return runProject(project, {
        tasks: ["a", "dopey:d", "sleepy:e"],
        environment: "production"
      }, function(err) {
        assert.ifError(err);
        assert.equal(ran, "bPcDaDe'Dd'De'D");
        return done();
      });
    });
  });
});


/*
//@ sourceMappingURL=tasksSpec.map
*/