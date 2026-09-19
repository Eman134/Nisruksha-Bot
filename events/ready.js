const trustedguilds = ['693150851396796446']
const { reportError } = require('../_classes/debug');

module.exports = {
   
    dependencies: ["cacheLists","client","company","events","shopExtension","uptime","version"],
    name: "clientReady",
    execute: async(dependencies) => {
        
        const client = dependencies.client;

        async function u(){

            try{
                client.user.setActivity(`[${dependencies.version}] Prefixo / | Tempo online: ${dependencies.uptime()}`);
            }catch (err){
                reportError(err, 'discord.ready.activity');
            }
        }
        u()
        setInterval(async() => {
            u()
        }, 60000);
        setInterval(async() => {
            if (typeof client.sweepMessages === 'function') client.sweepMessages(1800);
            client.emojis.cache.sweep((emoji) => {
                if (emoji.guild.name.includes('Emotes') || trustedguilds.includes(emoji.guild.id)) {
                    return false
                }
                return true
            })
        }, 1800000);
        const moment = require('moment')
        moment.suppressDeprecationWarnings = true;
        
        console.log(`\n         Bot iniciado.`.green);
        console.log(`         Versão ${dependencies.version}\n`.green)

        await dependencies.cacheLists.connect()
        await dependencies.cacheLists.remember.load()
        dependencies.company.jobs.process.load()
        dependencies.shopExtension.load()
        dependencies.events.load()
        
    }

}
