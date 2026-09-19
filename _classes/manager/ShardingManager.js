const { ShardingManager } = require('discord.js');

class ShardManager extends ShardingManager {

    constructor(options = {}) {
        if (!options.app?.token) {
            throw new Error('DISCORD_TOKEN não foi carregado. Configure o arquivo .env ou a variável de ambiente.');
        }

        super('./index.js', {
            totalShards: options.sharding?.shardAmount,
            token: options.app.token
        })

        this.on('shardCreate', shard => this.shardCreate(shard));
        this.on('shardDisconnect', shard => this.shardDisconnect(shard));
        this.on('shardReconnecting', shard => this.shardReconnecting(shard));

    }

    shardCreate(shard) {
        console.log(`[${shard.id}] `.green + `Shard iniciada`.gray)
    }

    shardDisconnect(shard){
        console.log(`[${shard.id}] `.red + `Shard desconectada`.gray)
    }

    shardReconnecting(shard){
        console.log(`[${shard.id}] `.yellow + `Reiniciando shard`.gray)
    }

    async connect() {
        return this.spawn()
    }

}

module.exports = ShardManager
