const { ShardingManager } = require('discord.js');

class ShardManager extends ShardingManager {

    constructor(options = {}) {

        super('./index.js', {
            totalShards: options.sharding.shardAmount,
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
        this.spawn()
    }

}

module.exports = ShardManager