module.exports = {
   
    name: "ready",
    execute: async(API) => {
        
        const client = API.client;

        /*{

            client.guilds.fetch('693150851396796446').then((guild) => {
              guild.emojis.fetch({ cache: true })
              guild.channels.fetch({ cache: true })
            }) // Nisruksha - Casa
            client.guilds.fetch('735638440443379784').then((guild) => {
              guild.emojis.fetch({ cache: true })
            }) // Emotes 0
            client.guilds.fetch('807671122530664469').then((guild) => {
              guild.emojis.fetch({ cache: true })
            }) // Emotes 1
            client.guilds.fetch('760899835347468318').then((guild) => {
              guild.emojis.fetch({ cache: true })
            }) // Emotes 2
            client.guilds.fetch('764484310861479967').then((guild) => {
              guild.emojis.fetch({ cache: true })
            }) // Emotes 3 
            client.guilds.fetch('765942939548385291').then((guild) => {
              guild.emojis.fetch({ cache: true })
            }) // Emotes 4
            client.guilds.fetch('781927849275031563').then((guild) => {
              guild.emojis.fetch({ cache: true })
            }) // Emotes 5
          
            console.log(`[CACHE] Otimização carregada`.green )
          
        }*/

        console.log(`\n         Bot iniciado.\n`.green);
        //API.updateBotInfo();
        async function u(){
            try{
                //API.updateBotInfo();
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

    }

}