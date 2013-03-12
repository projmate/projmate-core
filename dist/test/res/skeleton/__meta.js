/**
 * Copyright (c) 2013 Mario Gutierrez <mario@projmate.com>
 *
 * See the file COPYING for copying permission.
 */

var meta = {
  project: "Project Name",
  name: "Full Name",
  email: "E-mail",
  year: function() {
    return (new Date).getFullYear();
  },
  author: function() {
    return this.name + " <" + this.email + ">";
  }
};

