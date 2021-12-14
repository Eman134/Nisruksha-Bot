const ShardingManager = require('./_classes/manager/ShardingManager');
const config = require('./_classes/config');
require('colors')

new ShardingManager(config).connect()
    .then(() => {
        console.log('Conectado com sucesso!'.green)
    })  

    .catch(err => {             
        console.log('Erro ao conectar'.red)
        console.log(err)
    }
)