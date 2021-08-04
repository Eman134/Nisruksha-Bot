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

        
        console.log(`\n         Bot iniciado.\n`.green);

        API.cacheLists.remember.load()
        API.company.jobs.process.load()
        API.shopExtension.load()
        
    }

}