const API = require("../api.js");
const Database = require('../manager/DatabaseManager');
const DatabaseManager = new Database();
const config = require("../config");

const events = {

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

        const embed = new API.Discord.MessageEmbed()
        embed.setColor('#36393f')
        embed.setTitle('Evento | Corrida de Cavalos')

        // Code Review - CodeSmell: Variáveis com nomes genéricos e confusos ('inv', 'inv2', 'inv3', 'inv4'). Eles representam emojis de preenchimento invisíveis para o embed. Recomenda-se nomes descritivos (ex: spacerOrange, spacerRed, spacerPurple, spacerTrack).
        const inv = '<:inv:781993473331036251>'
        const inv2 = '<:inv2:838584020547141643>'
        const inv3 = '<:inv3:838584020571783179>'
        const inv4 = '<:inv4:838584020257734667>'

        const vencedor = events.race.vencedor

        let apostaslaranja = 0
        let apostasvermelho = 0
        let apostasroxo = 0

        // Code Review - CodeSmell: A variável de loop 'i' é inicializada sem declaração (let/const/var), causando vazamento no escopo global.
        for (i = 0; i < events.race.apostas.laranja.length; i++) {
            apostaslaranja += events.race.apostas.laranja[i].aposta
        }
        // Code Review - CodeSmell: A variável de loop 'i' é inicializada sem declaração (let/const/var), causando vazamento no escopo global.
        for (i = 0; i < events.race.apostas.vermelho.length; i++) {
            apostasvermelho += events.race.apostas.vermelho[i].aposta
        }
        // Code Review - CodeSmell: A variável de loop 'i' é inicializada sem declaração (let/const/var), causando vazamento no escopo global.
        for (i = 0; i < events.race.apostas.roxo.length; i++) {
            apostasroxo += events.race.apostas.roxo[i].aposta
        }

        embed.addField('<:info:736274028515295262> Informações', (aposta ? 'Sua aposta: `' + API.format(aposta) + ' ' + API.money + '` ' + API.moneyemoji + '\n': '') + 'Você receberá **1.5x**, ou seja, **50% de lucro da sua aposta** caso acerte o cavalo que ganhará a corrida.\nUtilize `/apostarcavalo <valor>` para fazer a sua aposta!')

        embed.addField(events.race.rodando ? '⏰ Tempo restante: ' + API.ms2(events.race.time-(Date.now()-events.race.started)) : 'Corrida de cavalos finalizada', 
        `
${vencedor == 1 ? '🎉|🏇' : '🏁|' + inv2}${vencedor != 0 && vencedor != 1 ? '🏇' : inv2}${inv2}${inv2}${inv2}|${vencedor != 0 ? inv : '🏇'}🟧${inv}\`${API.format(apostaslaranja)} ${API.money}\` ${API.moneyemoji}
${vencedor == 2 ? '🎉|🏇' : '🏁|' + inv3}${vencedor != 0 && vencedor != 2 ? '🏇' : inv3}${inv3}${inv3}${inv3}|${vencedor != 0 ? inv : '🏇'}🟥${inv}\`${API.format(apostasvermelho)} ${API.money}\` ${API.moneyemoji}
${vencedor == 3 ? '🎉|🏇' : '🏁|' + inv4}${vencedor != 0 && vencedor != 3 ? '🏇' : inv4}${inv4}${inv4}${inv4}|${vencedor != 0 ? inv : '🏇'}🟪${inv}\`${API.format(apostasroxo)} ${API.money}\` ${API.moneyemoji}
        `)

        let vencedorcor = ''
        let vencedorcornome = ''

        // Code Review - CodeSmell: Estrutura switch duplicada. A lógica para mapear o vencedor para cor/nome é idêntica à linha 220. Considere refatorar em uma função auxiliar ou objeto de mapeamento.
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

        // Code Review - CodeSmell: A variável de loop 'i' é inicializada sem declaração (let/const/var), causando vazamento no escopo global.
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

// Code Review - Falha de Arquitetura: Falta de separação de camadas. O módulo de agendamento/gerenciamento de eventos (`events`) executa diretamente lógica de apresentação visual (criação de MessageEmbed do Discord) e entrega de mensagens (`API.client.channels.cache...`), além de manipular dados brutos no banco. Recomenda-se mover a lógica de apresentação para uma camada visual/UI e delegar a entrega de alertas para um serviço de notificação (ex: NotificationService).
events.alert = async function(text) {
    
    try {
        const embed = new API.Discord.MessageEmbed()
        embed.setColor('RANDOM')
        embed.setTitle("Siga este canal em seu servidor para avisos de eventos")
        embed.setDescription(text)
        const channel = API.client.channels.cache.get(config.modules.events.channel)
        await channel.bulkDelete(10).catch()
        let eventinteraction 
        await channel.send({ embeds: [embed]}).then((embedinteraction) => {
            if (channel.type == 'GUILD_NEWS') embedinteraction.crosspost()
            eventinteraction = embedinteraction
        })

        return eventinteraction

    } catch (err) {
        API.client.emit('error', err)
    }
    return "Enviado com sucesso para " + config.modules.events.channel
}

events.forceTreasure = async function(loc) {

    events.treasure.loc = loc || API.random(1, 4)
    const treasurepos = await API.townExtension.getPosByTownNum(events.treasure.loc);
    events.treasure.pos = treasurepos
    events.treasure.profundidade = API.random(15, 45)
    events.treasure.picked = false

    events.alert("<:treasure:807671407160197141> **Um novo tesouro foi descoberto! Procure-o pelas vilas e seja o primeiro a pegá-lo**\nUtilize `/mapa` e `/pegartesouro` respectivamente para procurar e pegar o tesouro.")

}

events.forceDuck = async function(loc) {
    
    events.duck.loc = loc || API.random(1, 4)
    const duckpos = await API.townExtension.getPosByTownNum(events.duck.loc);

    events.duck.pos = duckpos
    events.duck.level = API.random(30, 50)
    events.duck.sta = API.random(events.duck.level*16, events.duck.level*22)
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


    const interaction = await events.alert("🐎 **O evento CORRIDA DE CAVALOS começou!**\nUtilize `/apostarcavalo <valor>` para fazer a sua aposta.\nO resultado final sai em **" + API.ms2(events.race.time) + "**\nVocê pode acompanhar o evento em <#807668576584597525> (No servidor oficial)")

    const embedinteraction = await interaction.reply({ embeds: [events.getRaceEmbed()], fetchReply: true })

    events.race.interactionid = embedinteraction.id

    const globalobj = await DatabaseManager.get(API.id, 'globals');

    const globalevents = globalobj.events

    if (globalevents == null) {
        DatabaseManager.set(API.id, 'globals', "events", {
            "race": events.race
        })
    } else {
        DatabaseManager.set(API.id, 'globals', "events", {
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
        events.race.vencedor = API.random(1, 3)

        let vencedorcor = ''
        let vencedorcornome = ''

        // Code Review - CodeSmell: Estrutura switch duplicada. A lógica para mapear o vencedor para cor/nome é idêntica à linha 80. Considere refatorar em uma função auxiliar ou objeto de mapeamento.
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

        // Code Review - CodeSmell: A variável de loop 'i' é inicializada sem declaração (let/const/var), causando vazamento no escopo global.
        for (i = 0; i < events.race.apostas[vencedorcornome].length; i++) {
            const user = events.race.apostas[vencedorcornome][i]
            await API.eco.money.add(user.id, Math.round(user.aposta*1.5))
            await API.eco.money.globalremove(Math.round(user.aposta*1.5))
            await API.eco.addToHistory(user.id, `Aposta 🏇${vencedorcor} | + ${API.format(Math.round(user.aposta*1.5))} ${API.moneyemoji}`)
        }
        
        embedinteraction.edit({ embeds: [events.getRaceEmbed()] })

        events.race.apostas = {
            laranja: [],
            vermelho: [],
            roxo: []
        }

        const globalobj = await DatabaseManager.get(API.id, 'globals');

        const globalevents = globalobj.events

        // Code Review - CodeSmell: Mutação direta de objeto compartilhado global. 'globalevents2' aponta para a mesma referência que 'globalevents'. Usar 'delete' modificará silenciosamente o cache global original. Considere clonar o objeto.
        let globalevents2 = globalevents
        
        delete globalevents2.race
        
        DatabaseManager.set(API.id, 'globals', "events", globalevents2)

    }


}

events.load = async function() {

    // Code Review - CodeSmell: O intervalo do evento é calculado apenas uma vez na inicialização, resultando em um intervalo estático para o setInterval. Se o objetivo era obter intervalos dinâmicos entre os eventos, prefira usar setTimeout recursivo.
    let intervalEvents = (API.random(config.modules.events.minInterval, config.modules.events.maxInterval))*60*1000

    const globalobj = await DatabaseManager.get(config.app.id, "globals")
    const globalevents = globalobj.events

    if (globalevents != null) {
        if (globalevents.race && globalevents.race.rodando) {
            events.race = globalevents.race

            let interaction 
            let ch = await API.client.channels.fetch(config.modules.events.channel);
            try{
                interaction = await ch.messages.fetch(events.race.interactionid)
            }catch {
                // Code Review - CodeSmell: Bloco catch vazio que ignora silenciosamente falhas de busca de mensagens do Discord.
            }

            if (!interaction) return


            editRace(interaction)
        }
    }
    
    setInterval(async () => {

        const event = API.random(0, 3)

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

    API.maqExtension.proxcot = Date.now()

    setInterval(async () => {
        
        API.maqExtension.forceCot()
        API.maqExtension.proxcot = Date.now()

    }, 60000*config.modules.cotacao);

    setInterval(async () => {
        
        API.shopExtension.forceDiscount()

        try {
            const botmoney = await API.eco.money.get(API.client.user.id)
            if (botmoney > 1000000) {
                API.eco.money.remove(API.client.user.id, 1000000)
                API.eco.token.add(API.client.user.id, 500)
            }
        } catch (error) {
            console.log(error)
            API.client.emit('error', error)
        }


    }, 60000*config.modules.discount);

}

module.exports = events