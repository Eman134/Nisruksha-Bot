module.exports = { // Renomeie para config.js
    prefix: ".",
    owner: ["422002630106152970"],

    ip: "localhost",
    port: 80,

    sharding: {
        shardAmount: 'auto'
    },

    databaseUrl: process.env.DATABASE_URL || 'postgresql://usuario:senha@localhost:5432/nisru?schema=public',

    redis: {
        url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
        prefix: process.env.REDIS_PREFIX || 'nisruksha'
    },

    best: {
        token: process.env.BEST_TOKEN || "",
        voteLogs_channel: ""
    },

    dbl: {
        token: process.env.DBL_TOKEN || "",
        webhookAuthPass: process.env.DBL_WEBHOOK_AUTH_PASS || "",
        voteLogs_channel: ""
    },
    
    app: {
        token: process.env.DISCORD_TOKEN || "",
        secret: process.env.OAUTH2_SECRET || "",
        id: "",
        callback: "/oauth2/callback",

        system: {
            timeout: 120000 // em ms
        }

    },

    modules: {

        cotacao: 20, // em minutos
        discount: 60, // em minutos

        events: {
            channel: "",
            minInterval: 30, // em minutos
            maxInterval: 60,

            race: {
                time: 30 // Tempo para apostas, em minutos
            }

        }
    }

}
