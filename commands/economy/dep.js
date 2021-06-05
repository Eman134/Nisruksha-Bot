module.exports = {
    name: 'depositar',
    aliases: ['dep'],
    category: 'Economia',
    description: 'Deposita uma quantia de dinheiro no banco central',
    options: [
        {
            name: 'quantia',
            type: 'STRING',
            description: 'Selecione uma quantia de dinheiro para depósito',
            required: true
        }],
        mastery: 20,
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const args = API.args(msg);

        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de dinheiro para depósito!`, `depositar <quantia | tudo>`)
            await msg.quote(embedtemp)
			return;
        }
        const money = await API.eco.money.get(msg.author)
        let total = 0;
        if (args[0] != 'tudo') {

            if (!API.isInt(API.toNumber(args[0]))) {
                const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de dinheiro (NÚMERO) para depósito!`, `depositar <quantia | tudo>`)
                await msg.quote(embedtemp)
                return;
            }

            if (money < API.toNumber(args[0])) {
                const embedtemp = await API.sendError(msg, `Você não possui essa quantia de dinheiro para depositar!`)
                await msg.quote(embedtemp)
                return;
            }

            if (API.toNumber(args[0]) < 1) {
                const embedtemp = await API.sendError(msg, `Você não pode depositar essa quantia de dinheiro!`)
                await msg.quote(embedtemp)
                return;
            }
            total = API.toNumber(args[0]);
        } else {
            if (money < 1) {
                const embedtemp = await API.sendError(msg, `Você não possui dinheiro para depositar!`)
                await msg.quote(embedtemp)
                return;
            }
            total = money;
        }
        let total2 = total;
        let taxa = await API.townExtension.getTownTax(msg.author);
        total = total2 - (Math.round(taxa*total2/100));
        
		const embed = new API.Discord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))

        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja depositar o valor de ${API.format(total2)} ${API.money} ${API.moneyemoji} na sua conta bancária?\nTaxa de depósito da vila atual (**${await API.townExtension.getTownName(msg.author)}**): ${taxa}% (${Math.round(taxa*total2/100)} ${API.money} ${API.moneyemoji})\nTotal a ser depositado: **${API.format(total)} ${API.money} ${API.moneyemoji}**`)
        let embedmsg = await msg.quote(embed);
        await embedmsg.react('✅')
        embedmsg.react('❌')

        const emojis = ['✅', '❌']

        const filter = (reaction, user) => {
            return user.id === msg.author.id;
        };

        const collector = embedmsg.createReactionCollector(filter, { time: 15000 });
        let reacted = false;
        collector.on('collect', async (reaction, user) => {
            await reaction.users.remove(user.id);
            if (!(emojis.includes(reaction.emoji.name))) return;
            reacted = true;
            collector.stop();
            if (reaction.emoji.name == '❌'){
                embed.fields = [];
                embed.setColor('#a60000');
                embed.addField('❌ Depósito cancelado', `
                Você cancelou o depósito de **${API.format(total2)} ${API.money} ${API.moneyemoji}** na sua conta bancária.`)
            } else {
                const money2 = await API.eco.money.get(msg.author);
                if (money2 < total) {
                    embed.fields = [];
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha no depósito', `Você não possui **${API.format(total2)} ${API.money} ${API.moneyemoji}** em mãos para depositar!`)
                } else {
                    embed.fields = [];
                    embed.setColor('#5bff45');
                    embed.addField('✅ Sucesso no depósito', `
                    Você depositou o valor de **${API.format(total)} ${API.money} ${API.moneyemoji}** na sua conta bancária!`)
                    API.eco.bank.add(msg.author, total);
                    API.eco.money.remove(msg.author, total2);
                    API.eco.addToHistory(msg.member, `📥 Depósito | + ${API.format(total)} ${API.moneyemoji}`)
                    let obj = await API.getInfo(msg.author, "players");
                    API.setInfo(msg.author, "players", "dep", obj.dep + 1);
                    API.eco.money.globaladd(taxa)
                }
            }
            embedmsg.edit(embed);
        });
        
        collector.on('end', collected => {
            embedmsg.reactions.removeAll().catch();
            if (reacted) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria depositar o valor de **${API.format(total2)} ${API.money} ${API.moneyemoji}** na sua conta bancária, porém o tempo expirou.`)
            embedmsg.edit(embed);
            return;
        });

	}
};