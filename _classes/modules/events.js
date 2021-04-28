const API = require("../api.js");
const config = require("../../_classes/config").modules;

const events = {

    treasure: {
        loc: 0,
        update: 5,
        profundidade: 0,
        pos: {},
        picked: false
    }

}

events.alert = async function(text) {
    try {
        const embed = new API.Discord.MessageEmbed()
        embed.setColor('RANDOM')
        embed.setTitle("Siga este canal em seu servidor para avisos de eventos")
        embed.setDescription(text)
        const channel = API.client.channels.cache.get(config.events.channel)
        await channel.bulkDelete(10).catch()
        await channel.send(embed).then((embedmsg) => {
            if (channel.type == 'news') embedmsg.crosspost()
        })
    } catch (err) {
        API.client.emit('error', err)
    }
    return "Enviado com sucesso para " + config.events.channel
}

events.forceTreasure = async function() {
    
    events.treasure.loc = API.random(1, 4)
    const treasurepos = await API.townExtension.getPosByTownNum(events.treasure.loc);
    events.treasure.pos = treasurepos
    events.treasure.profundidade = API.random(15, 45)
    events.treasure.picked = false

    events.alert("<:treasure:807671407160197141> **Um novo tesouro foi descoberto! Procure-o pelas vilas e seja o primeiro a pegá-lo**\nUtilize `" + API.prefix + "mapa` e `" + API.prefix + "pegartesouro` respectivamente para procurar e pegar o tesouro.")

}

async function loadIntervals() {

    let intervalEvents = (API.random(config.events.minInterval, config.events.maxInterval))*60*1000
    
    setInterval(async () => {
    
        events.forceTreasure()

    }, intervalEvents);

    setInterval(async () => {
        
        API.maqExtension.forceCot()

    }, 60000*config.cotacao);

}

loadIntervals()

module.exports = events