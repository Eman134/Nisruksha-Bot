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
        token: "",
        voteLogs_channel: ""
    },

    dbl: {
        token: "",
        webhookAuthPass: "",
        voteLogs_channel: ""
    },
    
    app: {
        token: "",
        secret: "",
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
