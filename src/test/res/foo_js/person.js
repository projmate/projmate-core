var Account = require("./account");

function Person(name) {
  this.name = name;
  this.account = new Account();
}


