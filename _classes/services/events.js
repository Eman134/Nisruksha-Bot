const Discord = require('../discordCompat');
const DatabaseManagerClass = require('../manager/DatabaseManager');
const clientService = require('./clientService');
const economyService = require('./economy');
const machineService = require('./machines');
const shopService = require('./shop');
const townsService = require('./towns');
const UtilityService = require('./utilityService');
const { reportError } = require('../debug');
const config = require("../config");
class EventsService {
constructor() {
const database = new DatabaseManagerClass();
const eco = economyService;
const format = new UtilityService().format.bind(new UtilityService());
const id = config.app.id;
const maqExtension = machineService;
const utility = new UtilityService();
const money = utility.money;
const moneyemoji = utility.moneyemoji;
const ms = utility.ms.bind(utility);
const random = utility.random.bind(utility);
const shopExtension = shopService;
const townExtension = townsService;
const DatabaseManager = database;

const events = this;
Object.assign(events, {

    treasure: {
        loc: 0,
        update: 5,
        profundidade: 0,
        pos: {},
        picked: false
    },

    duck: {
        loc: 0,
        sta: 0,
        level: 0,
        pos: {},
        killed: []
    },

    race: {
        time: config.modules.events.race.time*60*1000, // Tempo para apostas
        started: 0,
        rodando: false,

        interactionid: 0,

        vencedor: 0,

        apostas: {
            laranja: [],
            vermelho: [],
            roxo: []
        }

    },

    getRaceEmbed: function(aposta) {

        const embed = new Discord.MessageEmbed()
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

        embed.addField('<:info:736274028515295262> Informações', (aposta ? 'Sua aposta: `' + format(aposta) + ' ' + money + '` ' + moneyemoji + '\n': '') + 'Você receberá **1.5x**, ou seja, **50% de lucro da sua aposta** caso acerte o cavalo que ganhará a corrida.\nUtilize `/apostarcavalo <valor>` para fazer a sua aposta!')

        embed.addField(events.race.rodando ? '⏰ Tempo restante: ' + ms(events.race.time-(Date.now()-events.race.started), true) : 'Corrida de cavalos finalizada', 
        `
${vencedor == 1 ? '🎉|🏇' : '🏁|' + inv2}${vencedor != 0 && vencedor != 1 ? '🏇' : inv2}${inv2}${inv2}${inv2}|${vencedor != 0 ? inv : '🏇'}🟧${inv}\`${format(apostaslaranja)} ${money}\` ${moneyemoji}
${vencedor == 2 ? '🎉|🏇' : '🏁|' + inv3}${vencedor != 0 && vencedor != 2 ? '🏇' : inv3}${inv3}${inv3}${inv3}|${vencedor != 0 ? inv : '🏇'}🟥${inv}\`${format(apostasvermelho)} ${money}\` ${moneyemoji}
${vencedor == 3 ? '🎉|🏇' : '🏁|' + inv4}${vencedor != 0 && vencedor != 3 ? '🏇' : inv4}${inv4}${inv4}${inv4}|${vencedor != 0 ? inv : '🏇'}🟪${inv}\`${format(apostasroxo)} ${money}\` ${moneyemoji}
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
            embed.addField('Vencedor: 🏇' + vencedorcor, events.race.apostas[vencedorcornome].length == 0 ? '**Não houveram apostas no cavalo vencedor**' : '**Houveram no total ' + (events.race.apostas.laranja.length + events.race.apostas.vermelho.length + events.race.apostas.roxo.length) + ' apostas e somente ' + events.race.apostas[vencedorcornome].length + ' ganharam**\nUm total de `' + format(Math.round(apostas*1.5)) + ' ' + money + '` ' + moneyemoji + ' foi distribuído para os apostadores.')
        }

        return embed
    }

});

events.getConfig = function(){ return config }

events.alert = async function(text) {
    
    try {
        const embed = new Discord.MessageEmbed()
        embed.setColor('RANDOM')
        embed.setTitle("Siga este canal em seu servidor para avisos de eventos")
        embed.setDescription(text)
        const channel = clientService.current?.channels.cache.get(config.modules.events.channel)
        await channel.bulkDelete(10).catch((error) => reportError(error, 'events.bulk_delete'))
        let eventinteraction 
        await channel.send({ embeds: [embed]}).then((embedinteraction) => {
            if (channel.type == Discord.ChannelType.GuildAnnouncement) embedinteraction.crosspost()
            eventinteraction = embedinteraction
        })

        return eventinteraction

    } catch (err) {
        clientService.current?.emit('error', err)
    }
    return "Enviado com sucesso para " + config.modules.events.channel
}

events.forceTreasure = async function(loc) {

    events.treasure.loc = loc || random(1, 4)
    const treasurepos = await townExtension.getPosByTownNum(events.treasure.loc);
    events.treasure.pos = treasurepos
    events.treasure.profundidade = random(15, 45)
    events.treasure.picked = false

    events.alert("<:treasure:807671407160197141> **Um novo tesouro foi descoberto! Procure-o pelas vilas e seja o primeiro a pegá-lo**\nUtilize `/mapa` e `/pegartesouro` respectivamente para procurar e pegar o tesouro.")

}

events.forceDuck = async function(loc) {
    
    events.duck.loc = loc || random(1, 4)
    const duckpos = await townExtension.getPosByTownNum(events.duck.loc);

    events.duck.pos = duckpos
    events.duck.level = random(30, 50)
    events.duck.sta = random(events.duck.level*16, events.duck.level*22)
    events.duck.killed = []
    
    events.alert("<:pato:919946658941399091> **Um novo pato dourado de nível " + events.duck.level + " apareceu! Procure-o pelas vilas e seja o primeiro a matá-lo**\nUtilize `/mapa` e `/patodourado` respectivamente para procurar e matar o pato.")

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


    const interaction = await events.alert("🐎 **O evento CORRIDA DE CAVALOS começou!**\nUtilize `/apostarcavalo <valor>` para fazer a sua aposta.\nO resultado final sai em **" + ms(events.race.time, true) + "**\nVocê pode acompanhar o evento em <#807668576584597525> (No servidor oficial)")

    const embedinteraction = await interaction.reply({ embeds: [events.getRaceEmbed()], withResponse: true })

    events.race.interactionid = embedinteraction.id

    const globalobj = await DatabaseManager.get(id, 'globals');

    const globalevents = globalobj.events

    if (globalevents == null) {
        DatabaseManager.set(id, 'globals', "events", {
            "race": events.race
        })
    } else {
        DatabaseManager.set(id, 'globals', "events", {
            ...globalevents,
            "race": events.race
        })
    }

    editRace(embedinteraction)

}

async function editRace(embedinteraction) {

    if (!embedinteraction) return console.log('Not found interaction of race after restart')
    
    if (events.race.time-(Date.now()-events.race.started) > 0) {
        
        embedinteraction.edit({ embeds: [events.getRaceEmbed()] })
        setTimeout(function(){editRace(embedinteraction)}, 10000)

    } else {

        events.race.rodando = false
        events.race.vencedor = random(1, 3)

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
            await eco.money.add(user.id, Math.round(user.aposta*1.5))
            await eco.money.globalremove(Math.round(user.aposta*1.5))
            await eco.addToHistory(user.id, `Aposta 🏇${vencedorcor} | + ${format(Math.round(user.aposta*1.5))} ${moneyemoji}`)
        }
        
        embedinteraction.edit({ embeds: [events.getRaceEmbed()] })

        events.race.apostas = {
            laranja: [],
            vermelho: [],
            roxo: []
        }

        const globalobj = await DatabaseManager.get(id, 'globals');

        const globalevents = globalobj.events

        let globalevents2 = globalevents

        delete globalevents2.race

        DatabaseManager.set(id, 'globals', "events", globalevents2)

    }


}

events.load = async function() {

    let intervalEvents = (random(config.modules.events.minInterval, config.modules.events.maxInterval))*60*1000

    const globalobj = await DatabaseManager.get(config.app.id, "globals")
    const globalevents = globalobj.events

    if (globalevents != null) {
        if (globalevents.race && globalevents.race.rodando) {
            events.race = globalevents.race

            let interaction 
            let ch = await clientService.current?.channels.fetch(config.modules.events.channel);
            try{
                interaction = await ch.messages.fetch(events.race.interactionid)
            } catch (error) {
                reportError(error, 'events.race_message_fetch', { interactionId: events.race.interactionid });
            }

            if (!interaction) return


            editRace(interaction)
        }
    }
    
    setInterval(async () => {

        const event = random(0, 3)

        switch (event) {
            case 0:
                events.forceTreasure()
                break;
        
            case 1:
                events.forceRace()
                break;

            case 2:
                events.forceDuck()
                break;

            default:
                events.forceDuck()
                break;
        }
    

    }, intervalEvents);

    maqExtension.proxcot = Date.now()

    setInterval(async () => {
        
        maqExtension.forceCot()
        maqExtension.proxcot = Date.now()

    }, 60000*config.modules.cotacao);

    setInterval(async () => {
        
        shopExtension.forceDiscount()

        try {
            const botmoney = await eco.money.get(clientService.current.user.id)
            if (botmoney > 1000000) {
                eco.money.remove(clientService.current.user.id, 1000000)
                eco.token.add(clientService.current.user.id, 500)
            }
        } catch (error) {
            clientService.current?.emit('error', error)
        }


    }, 60000*config.modules.discount);

}

}
}

module.exports = new EventsService();
