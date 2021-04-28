module.exports = { // Rename to config.js
    prefix: ".",
    owner: ["422002630106152970"],

    ip: "localhost",
    port: 80, // Default 80
    ssl: false,

    db: {
        user: '',
        host: '',
        database: '',
        password: '',
        port: 5432,
    },

    dbl: {
        token: "",
        statsInterval: 1800000, // In ms
        webhookAuthPass: "",
        voteLogs_channel: ""
    },
    app: {
        token: "",
        secret: "",
        id: "",
        callback: "/oauth2/callback",

        system: {
            timeout: 120000 // In ms
        }

    },

    modules: {

        cotacao: 20, // In minutes

        events: {
            channel: "",
            minInterval: 30, // In minutes
            maxInterval: 60
        }
    }

}