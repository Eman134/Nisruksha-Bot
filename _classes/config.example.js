module.exports = { // Renomeie para config.js
    prefix: ".",
    owner: ["422002630106152970"],

    ip: "localhost",
    port: 80, // Padrão 80
    ssl: false,

    db: {
        user: '',
        host: '',
        database: '',
        password: '',
        port: 5432,
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