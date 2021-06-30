module.exports = {
    name: 'trocarfichas',
    aliases: ['tfichas', 'tf'],
    category: 'Jogos',
    description: 'Troca as suas fichas por uma quantia de dinheiro',
    options: [
        {
            name: 'quantia',
            type: 'STRING',
            description: 'Digite a quantia de fichas que deseja trocar',
            required: false
        }
    ],
    mastery: 20,
	async execute(API, msg) {

        const Discord = API.Discord;
        const args = API.args(msg);

        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de fichas para troca!`, `trocarfichas <quantia | tudo>`)
			await msg.quote({ embeds: [embedtemp]})
            return;
        }
        const token = await API.eco.token.get(msg.author)
        let fichas = 0;
        if (args[0] != 'tudo') {

            if (!API.isInt(args[0])) {
                const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de fichas (NÚMERO) para troca!`, `trocarfichas <quantia | tudo>`)
                await msg.quote({ embeds: [embedtemp]})
                return;
            }

            if (token < parseInt(args[0])) {
                const embedtemp = await API.sendError(msg, `Você não possui essa quantia de fichas para trocar!`)
                await msg.quote({ embeds: [embedtemp]})
                return;
            }

            if (parseInt(args[0]) < 1) {
                const embedtemp = await API.sendError(msg, `Você não pode trocar essa quantia de fichas!`)
                await msg.quote({ embeds: [embedtemp]})
                return;
            }
            fichas = parseInt(args[0]);
        } else {
            if (token < 1) {
                const embedtemp = await API.sendError(msg, `Você não possui fichas para trocar!`)
                await msg.quote({ embeds: [embedtemp]})
                return;
            }
            fichas = token;
        }

        if (fichas < 20) {
            const embedtemp = await API.sendError(msg, `A quantia mínima de fichas para troca é 20 fichas!`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let total = fichas*810;
        
		const embed = new Discord.MessageEmbed()
	    .setColor('#32a893')
        .addField('<a:loading:736625632808796250> Aguardando confirmação', `Você deseja trocar ${API.format(fichas)} ${API.money3} ${API.money3emoji} pelo valor de ${API.format(total)} ${API.money} ${API.moneyemoji}?`)
        
        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowButton([btn0, btn1])] });

        const filter = i => i.user.id === msg.author.id;
        
        let collector = embedmsg.createMessageComponentInteractionCollector({ filter, time: 30000 });

        let reacted = false;
        
        collector.on('collect', async(b) => {

            if (!(b.user.id === msg.author.id)) return

            b.deferUpdate().catch()
            reacted = true;
            collector.stop();
            if (b.customID == 'cancel'){
                collector.stop();
                embed.fields = [];
                embed.setColor('#a60000');
                embed.addField('❌ Troca cancelada', `
                Você cancelou a troca de ${API.format(fichas)} ${API.money3} ${API.money3emoji} pelo valor de ${API.format(total)} ${API.money} ${API.moneyemoji}.`)
                embedmsg.edit({ embeds: [embed], components: [] });
                return;
            } else {
                embed.fields = [];
                embed.setColor('#5bff45');
                embed.addField('✅ Sucesso na troca', `
                Você trocou ${API.format(fichas)} ${API.money3} ${API.money3emoji} pelo valor de ${API.format(total)} ${API.money} ${API.moneyemoji}`)
                embedmsg.edit({ embeds: [embed], components: [] });
                API.eco.token.remove(msg.author, fichas)
                API.eco.money.add(msg.author, total)
                API.eco.addToHistory(msg.author, `Troca | - ${API.format(fichas)} ${API.money3emoji} : + ${API.format(total)} ${API.moneyemoji}`)
            }
        });
        
        collector.on('end', collected => {
            if (reacted) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria trocar ${fichas} ${API.money3} ${API.money3emoji} pelo valor de ${total} ${API.money} ${API.moneyemoji}, porém o tempo expirou!`)
            embedmsg.edit({ embeds: [embed], components: [] });
            return;
        });

	}
};