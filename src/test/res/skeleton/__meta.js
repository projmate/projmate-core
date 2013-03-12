var meta = {
  project: "project name",
  name: "full name",
  email: "e-email",
  year: function() {
    return (new Date).getFullYear();
  },
  author: function() {
    return this.name + "<" + this.email + ">";
  }
};

