require('./_classes/loadEnv');
const ShardingManager = require('./_classes/manager/ShardingManager');
const config = require('./_classes/config');
const { reportError } = require('./_classes/debug');
require('colors')

new ShardingManager(config).connect()
    .then(() => {
        console.log('Conectado com sucesso!'.green)
    })  

    .catch(err => {             
        reportError(err, 'sharding.connect');
        process.exitCode = 1;
    }
)
