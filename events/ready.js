const trustedguilds = ['693150851396796446']

module.exports = {
   
    name: "ready",
    execute: async(API) => {
        
        const client = API.client;

        async function u(){
            try{
                client.user.setActivity(`[${API.version}] Prefixo / | Tempo online: ${API.uptime()}`);
            }catch (err){
                client.emit('error', err)
                console.log(err)
            }
            client.sweepMessages(1800);
            client.emojis.cache.sweep((emoji) => {
                if (emoji.guild.name.includes('Emotes') || trustedguilds.includes(emoji.guild.id)) {
                    return false
                }
                console.log(`Removendo emoji ${emoji.name}`)
                return true
            })
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