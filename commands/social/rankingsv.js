module.exports = {
    name: 'rankingsv',
    aliases: ['topsv', 'ranksv', 'ranklocal'],
    category: 'Social',
    description: 'Visualiza o ranking LOCAL de alguma categoria',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;

		const embed = new Discord.MessageEmbed()
        .setColor('#32a893')
        .setTitle('TOP 10 - LOCAL')
        .addField(`RANKING DE DINHEIRO`, `Reaja com ${API.client.emojis.cache.get('736290479406317649')}`)
        .addField(`RANKING DE FICHAS`, `Reaja com ${API.client.emojis.cache.get('741827151879471115')}`)
        .addField(`RANKING DE CRISTAIS`, `Reaja com ${API.client.emojis.cache.get('743176785986060390')}`)
        .addField(`RANKING DE NÍVEIS`, `Reaja com ${API.client.emojis.cache.get('736284021436317727')}`)
        .addField(`RANKING DE REPUTAÇÃO`, `Reaja com 👍🏽`)
        let embedmsg = await msg.quote(embed);

        try {
            embedmsg.react(API.client.emojis.cache.get('736290479406317649'));
            embedmsg.react(API.client.emojis.cache.get('741827151879471115'));
            embedmsg.react(API.client.emojis.cache.get('743176785986060390'));
            embedmsg.react(API.client.emojis.cache.get('736284021436317727'));
            embedmsg.react('👍🏽');
        }catch{}

        const filter = (reaction, user) => {
            return user.id === msg.author.id;
        };
      
        const emojis = ['736290479406317649', '741827151879471115', '736284021436317727', '743176785986060390', '👍🏽'];
        const vare = {
            '736290479406317649': 'players;money',
            '741827151879471115': 'players;token',
            '743176785986060390': 'players;points',
            '👍🏽': 'players;reps',
            '736284021436317727': 'machines;level'
        }
        
        const collector = embedmsg.createReactionCollector(filter, { time: 30000 });
        
        collector.on('collect', async (reaction, user) => {
            reaction.users.remove(user.id).catch();

            if (!(emojis.includes(reaction.emoji.id)) && !(emojis.includes(reaction.emoji.name))) return;
            if (emojis.includes(reaction.emoji.name)) reaction.emoji.id = reaction.emoji.name

            collector.stop();

            const text =  `SELECT * FROM ${vare[reaction.emoji.id].split(';')[0]};`
            let array = [];
            try {
                let res = await API.db.pool.query(text);
                array = res.rows;
            } catch (err) {
                console.log(err.stack)
                client.emit('error', err)
            }

            array = array.filter((userobj) => msg.guild.members.cache.has(userobj.user_id))

            array.sort(function(a, b){
                return b[vare[reaction.emoji.id].split(';')[1]] - a[vare[reaction.emoji.id].split(';')[1]];
            });

            array = array.slice(0, 10)

            var rank = 1;
            for (var i = 0; i < array.length; i++) {

                let member = await client.users.fetch(`${array[i].user_id}`);

                array[i].tag = member.tag;
                array[i].rank = rank;
                rank++;
            }

            let translate = {
                'token': API.money3 + ' ' + API.money3emoji,
                'points': API.money2 + ' ' + API.money2emoji,
                'money': API.money + ' ' + API.moneyemoji,
                'reps': 'reps 👍🏽',
                'level': 'níveis'
            }

            const embed2 = new Discord.MessageEmbed()
            .setTitle('Ranking local - ' + msg.guild.name)
            .setColor('#32a893')
            .setDescription(array.map(r => `${r.rank}º \`${r.tag}\` (${r.user_id}) - ${r[vare[reaction.emoji.id].split(';')[1]]} ${translate[vare[reaction.emoji.id].split(';')[1]]}`))
            embedmsg.edit(embed2)
        });
        
        collector.on('end', collected => {
            embedmsg.reactions.removeAll().catch();
        });

	}
};