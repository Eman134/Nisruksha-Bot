const API = require("../api.js");
const config = require("../../_classes/config").modules;

const events = {

    treasure: {
        loc: 0,
        update: 5,
        profundidade: 0,
        pos: {},
        picked: false
    },

    race: {
        time: config.events.race.time*60*1000, // Tempo para apostas
        started: 0,
        rodando: false,

        msgid: 0,

        vencedor: 0,

        apostas: {
            laranja: [],
            vermelho: [],
            roxo: []
        }

    },

    getRaceEmbed: function(aposta) {

        const embed = new API.Discord.MessageEmbed()
        embed.setColor('#36393f')
        embed.setTitle('Evento | Corrida de Cavalos')

        const inv = '<:inv:781993473331036251>'
        const inv2 = '<:inv2:838584020547141643>'
        const inv3 = '<:inv3:838584020571783179>'
        const inv4 = '<:inv4:838584020257734667>'

        const vencedor = events.race.vencedor

        let apostaslaranja = 0
        let apostasvermelho = 0
        let apostasroxo = 0

        for (i = 0; i < events.race.apostas.laranja.length; i++) {
            apostaslaranja += events.race.apostas.laranja[i].aposta
        }
        for (i = 0; i < events.race.apostas.vermelho.length; i++) {
            apostasvermelho += events.race.apostas.vermelho[i].aposta
        }
        for (i = 0; i < events.race.apostas.roxo.length; i++) {
            apostasroxo += events.race.apostas.roxo[i].aposta
        }

        embed.addField('<:info:736274028515295262> Informações', (aposta ? 'Sua aposta: `' + API.format(aposta) + ' ' + API.money + '` ' + API.moneyemoji + '\n': '') + 'Você receberá **1.5x**, ou seja, **50% de lucro da sua aposta** caso acerte o cavalo que ganhará a corrida.\nUtilize `' + API.prefix + 'apostarcavalo <valor>` para fazer a sua aposta!')

        embed.addField(events.race.rodando ? '⏰ Tempo restante: ' + API.ms2(events.race.time-(Date.now()-events.race.started)) : 'Corrida de cavalos finalizada', 
        `
${vencedor == 1 ? '🎉|🏇' : '🏁|' + inv2}${vencedor != 0 && vencedor != 1 ? '🏇' : inv2}${inv2}${inv2}${inv2}|${vencedor != 0 ? inv : '🏇'}🟧${inv}\`${API.format(apostaslaranja)} ${API.money}\` ${API.moneyemoji}
${vencedor == 2 ? '🎉|🏇' : '🏁|' + inv3}${vencedor != 0 && vencedor != 2 ? '🏇' : inv3}${inv3}${inv3}${inv3}|${vencedor != 0 ? inv : '🏇'}🟥${inv}\`${API.format(apostasvermelho)} ${API.money}\` ${API.moneyemoji}
${vencedor == 3 ? '🎉|🏇' : '🏁|' + inv4}${vencedor != 0 && vencedor != 3 ? '🏇' : inv4}${inv4}${inv4}${inv4}|${vencedor != 0 ? inv : '🏇'}🟪${inv}\`${API.format(apostasroxo)} ${API.money}\` ${API.moneyemoji}
        `)

        let vencedorcor = ''
        let vencedorcornome = ''

        switch (vencedor) {
            case 1:
                vencedorcor = '🟧'
                vencedorcornome = 'laranja'
                break;
            case 2:
                vencedorcor = '🟥'
                vencedorcornome = 'vermelho'
                break;
            case 3:
                vencedorcor = '🟪'
                vencedorcornome = 'roxo'
                break;
            default:
                vencedorcor = '🟧'
                vencedorcornome = 'laranja'
                break;
        }

        let apostas = 0

        for (i = 0; i < events.race.apostas[vencedorcornome].length; i++) {
            apostas += events.race.apostas[vencedorcornome][i].aposta
        }

        if (vencedor != 0) {
            embed.addField('Vencedor: 🏇' + vencedorcor, events.race.apostas[vencedorcornome].length == 0 ? '**Não houveram apostas no cavalo vencedor**' : '**Houveram no total ' + (events.race.apostas.laranja.length + events.race.apostas.vermelho.length + events.race.apostas.roxo.length) + ' apostas e somente ' + events.race.apostas[vencedorcornome].length + ' ganharam**\nUm total de `' + API.format(Math.round(apostas*1.5)) + ' ' + API.money + '` ' + API.moneyemoji + ' foi distribuído para os apostadores.')
        }

        return embed
    }

}

events.getConfig = function(){ return config }

events.alert = async function(text) {
    
    try {
        const embed = new API.Discord.MessageEmbed()
        embed.setColor('RANDOM')
        embed.setTitle("Siga este canal em seu servidor para avisos de eventos")
        embed.setDescription(text)
        const channel = API.client.channels.cache.get(config.events.channel)
        await channel.bulkDelete(10).catch()
        let eventmsg 
        await channel.send({ embeds: [embed]}).then((embedmsg) => {
            if (channel.type == 'GUILD_NEWS') embedmsg.crosspost()
            eventmsg = embedmsg
        })

        return eventmsg

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

events.forceRace = async function() {

    events.race.started = Date.now()
    events.race.apostas = {
        laranja: [],
        vermelho: [],
        roxo: []
    }

    events.race.rodando = true
    events.race.vencedor = 0


    const msg = await events.alert("🐎 **O evento CORRIDA DE CAVALOS começou!**\nUtilize `" + API.prefix + "apostarcavalo <valor>` para fazer a sua aposta.\nO resultado final sai em **" + API.ms2(events.race.time) + "**\nVocê pode acompanhar o evento em <#807668576584597525> (No servidor oficial)")

    const embedmsg = await msg.quote({ embeds: [events.getRaceEmbed()] })

    events.race.msgid = embedmsg.id

    const globalevents = await API.getGlobalInfo("events")

    if (globalevents == null) {
        API.setGlobalInfo("events", {
            "race": events.race
        })
    } else {
        API.setGlobalInfo("events", {
            ...globalevents,
            "race": events.race
        })
    }

    editRace(embedmsg)

}

async function editRace(embedmsg) {

    if (!embedmsg) return
    
    if (events.race.time-(Date.now()-events.race.started) > 0) {
        
        embedmsg.edit({ embeds: [events.getRaceEmbed()] })
        setTimeout(function(){editRace(embedmsg)}, 10000)

    } else {

        events.race.rodando = false
        events.race.vencedor = API.random(1, 3)

        let vencedorcor = ''
        let vencedorcornome = ''

        switch (events.race.vencedor) {
            case 1:
                vencedorcor = '🟧'
                vencedorcornome = 'laranja'
                break;
            case 2:
                vencedorcor = '🟥'
                vencedorcornome = 'vermelho'
                break;
            case 3:
                vencedorcor = '🟪'
                vencedorcornome = 'roxo'
                break;
            default:
                vencedorcor = '🟧'
                vencedorcornome = 'laranja'
                break;
        }

        for (i = 0; i < events.race.apostas[vencedorcornome].length; i++) {
            const user = events.race.apostas[vencedorcornome][i]
            await API.eco.money.add({ id: user.id }, Math.round(user.aposta*1.5))
            await API.eco.money.globalremove(Math.round(user.aposta*1.5))
            await API.eco.addToHistory({ id: user.id }, `Aposta 🏇${vencedorcor} | + ${API.format(Math.round(user.aposta*1.5))} ${API.moneyemoji}`)
        }
        
        embedmsg.edit({ embeds: [events.getRaceEmbed()] })

        events.race.apostas = {
            laranja: [],
            vermelho: [],
            roxo: []
        }


        const globalevents = await API.getGlobalInfo("events")

        let globalevents2 = globalevents

        delete globalevents2.race

        API.setGlobalInfo("events", globalevents2)

    }


}

async function loadIntervals() {

    let intervalEvents = (API.random(config.events.minInterval, config.events.maxInterval))*60*1000

    const globalevents = await API.getGlobalInfo("events")

    if (globalevents != null) {
        if (globalevents.race && globalevents.race.rodando) {
            events.race = globalevents.race

            let msg 
            let ch = await API.client.channels.fetch(config.events.channel);
            try{
                msg = await ch.messages.fetch(events.race.msgid)
            }catch (err) {
                API.client.emit('error', err)
            }


            editRace(msg)
        }
    }
    
    setInterval(async () => {

        const event = API.random(0, 2)

        switch (event) {
            case 0:

                events.forceTreasure()
                
                break;
        
            case 1:

                events.forceRace()

                break;

            default:

                events.forceTreasure()

                break;
        }
    

    }, intervalEvents);

    API.maqExtension.proxcot = Date.now()

    setInterval(async () => {
        
        API.maqExtension.forceCot()
        API.maqExtension.proxcot = Date.now()

    }, 60000*config.cotacao);

}

loadIntervals()

module.exports = events