require('./_classes/loadEnv');
const ShardingManager = require('./_classes/manager/ShardingManager');
const config = require('./_classes/config');
const cacheListsService = require('./_classes/services/cacheLists');
const { reportError } = require('./_classes/debug');
require('colors')

async function checkRedis() {
    try {
        await cacheListsService.connect();
        await cacheListsService.disconnect();
        return true;
    } catch (_) {
        await cacheListsService.disconnect().catch(() => undefined);
        console.error('Não foi possível iniciar o bot: Redis indisponível.');
        return false;
    }
}

async function start() {
    if (!await checkRedis()) {
        process.exitCode = 1;
        return;
    }

    try {
        await new ShardingManager(config).connect();
        console.log('Conectado com sucesso!'.green);
    } catch (error) {
        reportError(error, 'sharding.connect');
        process.exitCode = 1;
    }
}

start();
