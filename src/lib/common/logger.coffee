logmagic = require("mgutz-logmagic")
logmagic.route logmagic.ROOT, "DEBUG", "console"

exports.getLogger = (name) -> logmagic.local(name)

