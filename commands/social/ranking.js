module.exports = {
    name: 'ranking',
    aliases: ['top', 'rank', 'rankglobal'],
    category: 'Social',
    description: 'Visualiza o ranking GLOBAL de alguma categoria',
    mastery: 3,
	async execute(API, msg) {

        const Discord = API.Discord;
        const client = API.client;

        let vare = {
            '736290479406317649': {
                db: {
                    table: 'players',
                    column: 'money'
                },
                name: API.money,
                formated: API.money + ' ' + API.moneyemoji
            },
            '741827151879471115': {
                db: {
                    table: 'players',
                    column: 'points'
                },
                name: API.money2,
                formated: API.money2 + ' ' + API.money2emoji
            },
            '741827151879471115': {
                db: {
                    table: 'players',
                    column: 'token'
                },
                name: API.money3,
                formated: API.money3 + ' ' + API.money3emoji
            },
            '👍🏽': {
                db: {
                    table: 'players',
                    column: 'reps'
                },
                name: 'reputação',
                formated: 'reps 👍🏽'
            },
            '833363716615307324': {
                db: {
                    table: 'machines',
                    column: 'level'
                },
                name: 'níveis',
                formated: 'níveis'
            },
            '💥': {
                db: {
                    table: 'players',
                    column: 'streak'
                },
                name: 'streak',
                formated: 'streak'
            },
            '🔰': {
                db: {
                    table: 'players',
                    column: 'mastery'
                },
                name: API.mastery.name,
                formated: API.mastery.name + ' ' + API.mastery.emoji
            }
        }

        let rankingtype = 0
        let current = ''

		const embed = new Discord.MessageEmbed()
        .setColor('#32a893')
        .setAuthor('Top ' + (rankingtype == 0 ? 'Global' : 'Local'), (rankingtype == 1 ? msg.guild.iconURL({ format: 'png', dynamic: true, size: 1024 }) : API.client.user.avatarURL()))

        .setDescription(Object.keys(vare).map((key) => `<:arrow:737370913204600853> Ranking de ${vare[key].name} ${!API.client.emojis.cache.get(key) ? key : API.client.emojis.cache.get(key)}`).join('\n'))

        let components = []

        reworkButtons(0)
        
        function reworkButtons(type, disabled) {

            let butnList = []

            components = []

            butnList.push(API.createButton('change', (type == 0 ? 'SUCCESS' : 'PRIMARY'), (type == 0 ? 'Global' : 'Local'), '🔁'))

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
                const rowBtn = API.rowButton(butnList.slice(var1, var2))
                if (rowBtn.components.length > 0) components.push(rowBtn)

            }

        }

        let embedmsg = await msg.quote({ embeds: [embed], components });

        const filter = (button) => button.clicker != null && button.clicker.user != null && button.clicker.user.id == msg.author.id
        
        const collector = embedmsg.createButtonCollector(filter, { time: 30000 });
        
        collector.on('collect', async (b) => {

            if (b.id == 'change') {
                rankingtype = (rankingtype == 0 ? 1 : 0)
                embed.setAuthor('Top ' + (rankingtype == 0 ? 'Global' : 'Local'), (rankingtype == 1 ? msg.guild.iconURL({ format: 'png', dynamic: true, size: 1024 }) : API.client.user.avatarURL()))
                if (current == 'change' || current == '') {
                    reworkButtons(rankingtype)
                    b.defer()
                    return await embedmsg.edit({embed, components})
                } 
                b.id = current
            }
            
            current = b.id

            reworkButtons(rankingtype, b.id)
            
            const text =  `SELECT * FROM ${vare[b.id].db.table};`
            let array = [];
            try {
                let res = await API.db.pool.query(text);
                array = res.rows;
            } catch (err) {
                console.log(err.stack)
                API.client.emit('error', err)
            }

            if (rankingtype == 1) {
                
                const arr2check = []

                for (i = 0; i < array.length; i++) {
                    let x1
                    try {
                        const x = await msg.guild.members.fetch(array[i].user_id)
                        if (x) x1 = true
                        else x1 = false
                    } catch {
                        x1 = false
                    }
                    if (x1) arr2check.push(array[i])
                }

                array = arr2check
            }

            array.sort(function(c, d){
                return d[vare[b.id].db.column] - c[vare[b.id].db.column];
            });

            array = array.slice(0, 10)

            var rank = 1;
            for (var i = 0; i < array.length; i++) {

                let member = await client.users.fetch(`${array[i].user_id}`);

                array[i].tag = member.tag;
                array[i].rank = rank;
                rank++;
            }

            const maparray = array.map(r => `${r.rank}º \`${r.tag}\` (${r.user_id}) - ${r[vare[b.id].db.column]} ${vare[b.id].formated}`).join('\n')

            const obj = array.find((u) => u.user_id == msg.author.id )
            const pos = array.indexOf(obj)+1

            embed
            .setTitle('🥇 Sua posição: ' + pos + 'º')
            .setAuthor('Top ' + (rankingtype == 0 ? 'Global' : 'Local') + ': ' + vare[b.id].name, (rankingtype == 1 ? msg.guild.iconURL({ format: 'png', dynamic: true, size: 1024 }) : API.client.user.avatarURL()))
            .setColor('#32a893')
            .setDescription(maparray)

            collector.resetTimer()

            await embedmsg.edit({embed, components})
            b.defer()
            
        });
        
        collector.on('end', collected => {
            embedmsg.edit({ embeds: [embed] })
        });

	}
};