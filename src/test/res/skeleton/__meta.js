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

