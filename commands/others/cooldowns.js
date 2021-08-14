module.exports = {
    name: 'cooldowns',
    aliases: ['cd'],
    category: 'Outros',
    description: 'Visualize todos os cooldowns ativos',
    options: [{
        name: 'membro',
        type: 'USER',
        description: 'Veja os cooldowns ativos de um membro',
        required: false
    }],
    mastery: 25,
	async execute(API, msg) {

        let member;
        let args = API.args(msg)
        if (!msg.slash) {
            if (msg.mentions.users.size < 1) {
                if (args.length == 0) {
                    member = msg.author;
                } else {
                    try {
                    let member2 = await client.users.fetch(args[0])
                    if (!member2) {
                        member = msg.author
                    } else {
                        member = member2
                    }
                    } catch {
                        member = msg.author
                    }
                }
            } else {
                member = msg.mentions.users.first();
            }
        } else {
            if (msg.options._hoistedOptions.length <= 0) {
                member = msg.author
            } else {
                member = msg.options._hoistedOptions[0].user;
            }
        }

        let filtered = []

        let blacklist = [ 'daily2' ]

        try {
            let res2 = await API.db.pool.query(`SELECT * FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cooldowns';`);

            for (i = 1; i < res2.rows.length; i++) {
                const cd = await API.playerUtils.cooldown.check(member, res2.rows[i].column_name)
                if (cd) {
                    const cd2 = await API.playerUtils.cooldown.get(member, res2.rows[i].column_name)
                    filtered.push( {
                        name: res2.rows[i].column_name,
                        time: cd2
                    })
                }
            }

        } catch (err) {
            API.client.emit('error', err)
        }

        const embed = new API.Discord.MessageEmbed()
        .setColor('#4ae8ac')
        .setTitle('⏰ Lista de cooldowns ativos')
        .setAuthor(member.tag, member.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))

        if (filtered.length > 0) {

            embed.setDescription( filtered.map((i) => `${i.name} <:arrow:737370913204600853> \`${API.ms2(i.time)}\`` ).join('\n') )

        } else {
            embed.setDescription('Não possui nenhum cooldown ativo!')
        }

        await msg.quote({ embeds: [embed]});

	}
};