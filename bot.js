
require("colors")

// Iniciar client
const NisrukshaClient = require('./_classes/NisrukshaClient')

const config = require("./_classes/config")

const client = new NisrukshaClient(config)

client.login()

