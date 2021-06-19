module.exports = {
   
    name: "ready",
    execute: async(API) => {
        
        const client = API.client;

        async function u(){
            try{

                client.user.setActivity(`[${API.version}] Prefixo ${API.prefix} | Tempo online: ${API.uptime()}`);
            }catch (err){
                client.emit('error', err)
                console.log(err)
            }
        }
        u()
        setInterval(async() => {
            u()
        }, 60000);
        const moment = require('moment')
        moment.suppressDeprecationWarnings = true;

        API.cacheLists.remember.load()
        API.shopExtension.load()
        API.company.jobs.process.load()

        console.log(`\n         Bot iniciado.\n`.green);

    }

}