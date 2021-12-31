const Database = require('../../_classes/manager/DatabaseManager');
const DatabaseManager = new Database();

const API = require('../../_classes/api');

const vare = {
    '736290479406317649': {
        db: {
            table: 'players',
            column: 'money'
        },
        name: API.money,
        formated: API.money + ' ' + API.moneyemoji,
        global: [],
    },
    '743176785986060390': {
        db: {
            table: 'players',
            column: 'points'
        },
        name: API.money2,
        formated: API.money2 + ' ' + API.money2emoji,
        global: [],
    },
    '741827151879471115': {
        db: {
            table: 'players',
            column: 'token'
        },
        name: API.money3,
        formated: API.money3 + ' ' + API.money3emoji,
        global: [],
    },
    '👍🏽': {
        db: {
            table: 'players',
            column: 'reps'
        },
        name: 'reputação',
        formated: 'reps 👍🏽',
        global: [],
    },
    '833363716615307324': {
        db: {
            table: 'machines',
            column: 'level'
        },
        name: 'níveis',
        formated: 'níveis',
        global: [],
    },
    '💥': {
        db: {
            table: 'players',
            column: 'streak'
        },
        name: 'streak',
        formated: 'streak',
        global: [],
    },
    '🔰': {
        db: {
            table: 'players',
            column: 'mastery'
        },
        name: API.mastery.name,
        formated: API.mastery.name + ' ' + API.mastery.emoji,
        global: [],
    },
    '⚙': {
        db: {
            table: 'players',
            column: 'cmdsexec'
        },
        name: 'comandos',
        formated: 'comandos executados ⚙',
        global: [],
    }
}

async function setRankCache() {
    for (let i = 0; i < Object.keys(vare).length; i++) {
        const data = Object.values(vare)[i];
        data.emoji = Object.keys(vare)[i];

        const text =  `SELECT * FROM ${data.db.table};`
        let array = [];
        try {
            let res = await DatabaseManager.query(text);
            array = res.rows;
        } catch (err) {
            console.log(err.stack)
            API.client.emit('error', err)
        }
        vare[data.emoji].global = array.sort((a, b) => b[data.db.column] - a[data.db.column]);
    }
}

setRankCache()
setInterval(setRankCache, 360000)

module.exports = {
    name: 'ranking',
    aliases: ['top', 'rank', 'rankglobal'],
    category: 'Social',
    description: 'Visualiza o ranking GLOBAL de alguma categoria',
    mastery: 3,
	async execute(API, interaction) {

        const Discord = API.Discord;
        const client = API.client;

        let rankingtype = 0
        let current = ''

		const embed = new Discord.MessageEmbed()
        .setColor('#32a893')
        .setAuthor('Top ' + (rankingtype == 0 ? 'Global' : 'Local'), (rankingtype == 1 ? interaction.guild.iconURL({ format: 'png', dynamic: true, size: 1024 }) : API.client.user.avatarURL()))

        .setDescription(Object.keys(vare).map((key) => `<:arrow:737370913204600853> Ranking de ${vare[key].name} ${!API.client.emojis.cache.get(key) ? key : API.client.emojis.cache.get(key)}`).join('\n'))

        let components = []

        reworkButtons(0)
        
        function reworkButtons(type, disabled) {

            let butnList = []

            components = []

            //butnList.push(API.createButton('change', (type == 0 ? 'SUCCESS' : 'PRIMARY'), (type == 0 ? 'Global' : 'Local'), '🔁'))

            for (i = 0; i < Object.keys(vare).length; i++) {
                butnList.push(API.createButton(Object.keys(vare)[i], (disabled == Object.keys(vare)[i] ? 'SUCCESS': 'SECONDARY'), '', Object.keys(vare)[i], (disabled == Object.keys(vare)[i] ? true : false)))
            }

            let totalcomponents = butnList.length % 5;
            if (totalcomponents == 0) totalcomponents = (butnList.length)/5;
            else totalcomponents = ((butnList.length-totalcomponents)/5);

            totalcomponents += 1

            for (x = 0; x < totalcomponents; x++) {
                const var1 = (x+1)*5-5
                const var2 = ((x+1)*5)
                const rowBtn = API.rowComponents(butnList.slice(var1, var2))
                if (rowBtn.components.length > 0) components.push(rowBtn)

            }

        }

        let embedinteraction = await interaction.reply({ embeds: [embed], components, fetchReply: true });

        const filter = i => i.user.id === interaction.user.id
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });

        let waiting = false
        
        collector.on('collect', async (b) => {

            b.deferUpdate()

            if (b.customId == 'change') {
                rankingtype = (rankingtype == 0 ? 1 : 0)
                embed.setAuthor('Top ' + (rankingtype == 0 ? 'Global' : 'Local'), (rankingtype == 1 ? interaction.guild.iconURL({ format: 'png', dynamic: true, size: 1024 }) : API.client.user.avatarURL()))
                b.customId = current
            }
            
            current = b.customId
            
            let array = vare[b.customId].global

            reworkButtons(rankingtype, b.customId)

            /*
            if (rankingtype == 1 && !waiting) {

                waiting = true
                
                const arr2check = []

                for (i = 0; i < array.length; i++) {

                    try {
                        const x = await interaction.guild.members.fetch(array[i].user_id)
                        arr2check.push(array[i])
                    } catch {
                    }

                }

                array = arr2check
            }*/

            const obj = array.find((u) => u.user_id == interaction.user.id )
            const pos = array.indexOf(obj)+1

            array = array.slice(0, 10)

            for (var i = 0; i < array.length; i++) {

                let member = await client.users.fetch(`${array[i].user_id}`);

                array[i].tag = member.tag;
                array[i].rank = i+1;
            }

            const maparray = array.map(r => `${r.rank}º \`${r.tag}\` (${r.user_id}) - ${r[vare[b.customId].db.column]} ${vare[b.customId].formated}`).join('\n')

            embed
            .setTitle('🥇 Sua posição: ' + pos + 'º')
            .setAuthor('Top ' + (rankingtype == 0 ? 'Global' : 'Local') + ': ' + vare[b.customId].name, (rankingtype == 1 ? interaction.guild.iconURL({ format: 'png', dynamic: true, size: 1024 }) : API.client.user.avatarURL()))
            .setColor('#32a893')
            .setDescription(maparray)

            collector.resetTimer()

            await interaction.editReply({ embeds: [embed], components })

            waiting = false
            
        });
        
        collector.on('end', collected => {
            interaction.editReply({ embeds: [embed], components: [] })
        });

	}
};