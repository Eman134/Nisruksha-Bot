const trustedguilds = ['693150851396796446']
const { reportError } = require('../_classes/debug');
const clientService = require('../_classes/services/clientService');
const cacheListsService = require('../_classes/services/cacheLists');
const companyService = require('../_classes/services/company');
const eventsService = require('../_classes/services/events');
const shopService = require('../_classes/services/shop');
const UtilityService = require('../_classes/services/utilityService');
const utility = new UtilityService();

module.exports = {
   
    name: "clientReady",
    execute: async() => {
        
        const client = clientService.current;

        async function u(){

            try{
                client.user.setActivity(`[${require('../package.json').version}] Prefixo / | Tempo online: ${utility.uptime()}`);
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
        console.log(`         Versão ${require('../package.json').version}\n`.green)

        await cacheListsService.connect()
        await cacheListsService.remember.load()
        companyService.jobs.process.load()
        shopService.load()
        eventsService.load()
        
    }

}
