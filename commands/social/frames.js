module.exports = {
    name: 'molduras',
    aliases: ["frames"],
    category: 'Social',
    description: 'Faça a escolha da moldura que será apresentada em seu perfil',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;

        const obj = await API.getInfo(msg.author, "players")

        let frames = obj.frames

        if (frames == null || frames.length == 0) {
            API.sendError(msg, 'Você não possui molduras disponíveis para serem apresentadas.')
            return;
        }

        frames = frames.filter((i) => i != '0')

        const total = frames.length
        let current = 1

        const check = await API.playerUtils.cooldown.check(msg.author, "molduras");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'molduras', 'visualizar suas molduras')

            return;
        }

        API.playerUtils.cooldown.set(msg.author, "molduras", 30);
        
		const embed = new Discord.MessageEmbed()
        .setTitle('🖼 Moldura ' + current + '/' + total + ' | ' + API.frames.get(frames[0]).name)
        .setImage(API.frames.get(frames[0]).url)
        .setColor('#60ced6')
		.setDescription(`Reaja com ✅ para selecionar alguma moldura\nReaja com ❌ para retirar a moldura atual\nReaja com ⏪, ⏩, ◀ ou ▶ para visualizar outras molduras`)
        const embedmsg = await msg.quote(embed);
        
        await embedmsg.react('✅')
        await embedmsg.react('❌')
        if (total > 1) {
            embedmsg.react('⏪');
            embedmsg.react('◀');
            embedmsg.react('▶');
            embedmsg.react('⏩');
        }

        const filter = (reaction, user) => {
            return user.id === msg.author.id;
        };

        const emojis = ['✅', '❌', '⏪', '⏩', '◀', '▶']
        
        const collector = embedmsg.createReactionCollector(filter, { time: 30000 });

        collector.on('collect', async (reaction, user) => {
            await reaction.users.remove(user.id);
            if (!(emojis.includes(reaction.emoji.name))) return;

            collector.resetTimer();

            API.playerUtils.cooldown.set(msg.author, "molduras", 30);

            if (reaction.emoji.name == '▶'){
                if (current < total) current += 1;
            } if (reaction.emoji.name == '◀'){
                if (current > 1) current -= 1;
            }

            if (reaction.emoji.name == '⏩'){
                current = total;
            } if (reaction.emoji.name == '⏪'){
                current = 1;
            }

            const frame = API.frames.get(frames[current-1])

            embed.setTitle('🖼 Moldura ' + current + '/' + total + ' | ' + frame.name)

            if (reaction.emoji.name == '❌') {
                
                API.frames.reforge(msg.author, 0)

                embed.setColor('#a60000');
                embed.setDescription('❌ Moldura desequipada')
                embed.setImage(API.frames.get(frames[0]).url)
                embedmsg.edit(embed);

                return collector.stop();

            } else if (reaction.emoji.name == '✅'){
                API.frames.reforge(msg.author, frame.id)

                embed.setColor('#5bff45');
                embed.setDescription('✅ Moldura equipada')
                embed.setImage(frame.url)
                embedmsg.edit(embed);
                
                return collector.stop();
            } else {
                
                embed.setImage(frame.url)
                embedmsg.edit(embed);
            }

        });
        
        collector.on('end', async collected => {
            embedmsg.reactions.removeAll();

            API.playerUtils.cooldown.set(msg.author, "molduras", 0);

        });

	}
};