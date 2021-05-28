module.exports = {
    name: 'trocarfichas',
    aliases: ['tfichas', 'tf'],
    category: 'Jogos',
    description: 'Troca as suas fichas por uma quantia de dinheiro',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;
        const args = API.args(msg);

        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de fichas para troca!`, `trocarfichas <quantia | tudo>`)
			await msg.quote(embedtemp)
            return;
        }
        const token = await API.eco.token.get(msg.author)
        let fichas = 0;
        if (args[0] != 'tudo') {

            if (!API.isInt(args[0])) {
                const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de fichas (NÚMERO) para troca!`, `trocarfichas <quantia | tudo>`)
                await msg.quote(embedtemp)
                return;
            }

            if (token < parseInt(args[0])) {
                const embedtemp = await API.sendError(msg, `Você não possui essa quantia de fichas para trocar!`)
                await msg.quote(embedtemp)
                return;
            }

            if (parseInt(args[0]) < 1) {
                const embedtemp = await API.sendError(msg, `Você não pode trocar essa quantia de fichas!`)
                await msg.quote(embedtemp)
                return;
            }
            fichas = parseInt(args[0]);
        } else {
            if (token < 1) {
                const embedtemp = await API.sendError(msg, `Você não possui fichas para trocar!`)
                await msg.quote(embedtemp)
                return;
            }
            fichas = token;
        }

        if (fichas < 20) {
            const embedtemp = await API.sendError(msg, `A quantia mínima de fichas para troca é 20 fichas!`)
            await msg.quote(embedtemp)
            return;
        }

        let total = fichas*810;
        
		const embed = new Discord.MessageEmbed()
	    .setColor('#32a893')
        .addField('<a:loading:736625632808796250> Aguardando confirmação', `Você deseja trocar ${API.format(fichas)} ${API.money3} ${API.money3emoji} pelo valor de ${API.format(total)} ${API.money} ${API.moneyemoji}?`)
        const embedmsg = await msg.quote(embed);
        embedmsg.react('✅')
        embedmsg.react('❌')

        const filter = (reaction, user) => {
            return user.id === msg.author.id;
        };
      
        const emojis = ['✅', '❌'];
        
        let collector = embedmsg.createReactionCollector(filter, { time: 30000 });

        let reacted = false;
        
        collector.on('collect', async(reaction, user) => {
            await reaction.users.remove(user.id);
            if (!(emojis.includes(reaction.emoji.name))) {
              return;
            }
            reacted = true;
            collector.stop();
            if (reaction.emoji.name == '❌'){
                collector.stop();
                embed.fields = [];
                embed.setColor('#a60000');
                embed.addField('❌ Troca cancelada', `
                Você cancelou a troca de ${API.format(fichas)} ${API.money3} ${API.money3emoji} pelo valor de ${API.format(total)} ${API.money} ${API.moneyemoji}.`)
                embedmsg.edit(embed);
                return;
            } else {
                embed.fields = [];
                embed.setColor('#5bff45');
                embed.addField('✅ Sucesso na troca', `
                Você trocou ${API.format(fichas)} ${API.money3} ${API.money3emoji} pelo valor de ${API.format(total)} ${API.money} ${API.moneyemoji}`)
                embedmsg.edit(embed);
                API.eco.token.remove(msg.author, fichas)
                API.eco.money.add(msg.author, total)
                API.eco.addToHistory(msg.member, `Troca | - ${API.format(fichas)} ${API.money3emoji} : + ${API.format(total)} ${API.moneyemoji}`)
            }
        });
        
        collector.on('end', collected => {
            embedmsg.reactions.removeAll();
            if (reacted) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria trocar ${fichas} ${API.money3} ${API.money3emoji} pelo valor de ${total} ${API.money} ${API.moneyemoji}, porém o tempo expirou!`)
            embedmsg.edit(embed);
            return;
        });

	}
};