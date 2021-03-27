
require("colors")

// Iniciar client
const MenuClient = require('./_classes/MenuClient')

const config = require("./_classes/config")

const client = new MenuClient(config)

client.login()