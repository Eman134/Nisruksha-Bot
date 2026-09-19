
require("colors")

const config = require("./_classes/config")
const { createBot } = require('./_classes/bootstrap');

const client = createBot(config)

client.login()

