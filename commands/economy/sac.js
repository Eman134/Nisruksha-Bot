module.exports = {
    name: 'sacar',
    aliases: ['sac'],
    category: 'Economia',
    description: 'Saca uma quantia de dinheiro do banco central',
    options: [
    {
        name: 'quantia',
        type: 'STRING',
        description: 'Selecione uma quantia de dinheiro para saque',
        required: true
    }],
    mastery: 20,
	async execute(API, msg) {

        const args = API.args(msg);

        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de dinheiro para saque!`, `sacar <quantia | tudo>`)
            await msg.quote(embedtemp)
			return;
        }
        const money = await API.eco.bank.get(msg.author)
        let total = 0;
        if (args[0] != 'tudo') {

            if (!API.isInt(API.toNumber(args[0]))) {
                const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de dinheiro (NÚMERO) para saque!`, `sacar <quantia | tudo>`)
                await msg.quote(embedtemp)
                return;
            }

            if (money < API.toNumber(args[0])) {
                const embedtemp = await API.sendError(msg, `Você não possui essa quantia __no banco__ de dinheiro para sacar!`)
                await msg.quote(embedtemp)
                return;
            }

            if (API.toNumber(args[0]) < 1) {
                const embedtemp = await API.sendError(msg, `Você não pode sacar essa quantia de dinheiro!`)
                await msg.quote(embedtemp)
                return;
            }
            total = API.toNumber(args[0]);
        } else {
            if (money < 1) {
                const embedtemp = await API.sendError(msg, `Você não possui dinheiro __no banco__ para sacar!`)
                await msg.quote(embedtemp)
                return;
            }
            total = money;
        }

        const Discord = API.Discord;
        const client = API.client;
        
		const embed = new API.Discord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))

        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja sacar o valor de **${API.format(total)} ${API.money} ${API.moneyemoji}** da sua conta bancária?`)

        const btn0 = API.createButton('confirm', 'grey', '', '✅')
        const btn1 = API.createButton('cancel', 'grey', '', '❌')

        let embedmsg = await msg.quote({ embed, components: [API.rowButton([btn0, btn1])] });

        const filter = (button) => button.clicker != null && button.clicker.user != null && button.clicker.user.id == msg.author.id
        
        const collector = embedmsg.createButtonCollector(filter, { time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {
            reacted = true;
            collector.stop();
            await b.defer()
            if (b.id == 'cancel'){
                embed.fields = [];
                embed.setColor('#a60000');
                embed.addField('❌ Saque cancelado', `
                Você cancelou o saque de **${API.format(total)} ${API.money} ${API.moneyemoji}** da sua conta bancária.`)
            } else {
                const money2 = await API.eco.bank.get(msg.author);
                if (money2 < total) {
                    embed.fields = [];
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha no saque', `Você não possui **${API.format(total)} ${API.money} ${API.moneyemoji}** __no banco__ para sacar!`)
                } else {
                    embed.fields = [];
                    embed.setColor('#5bff45');
                    embed.addField('✅ Sucesso no saque', `
                    Você sacou o valor de **${API.format(total)} ${API.money} ${API.moneyemoji}** da sua conta bancária!`)
                    API.eco.money.add(msg.author, total);
                    API.eco.bank.remove(msg.author, total);
                    API.eco.addToHistory(msg.member, `📤 Saque | - ${API.format(total)} ${API.moneyemoji}`)
                    let obj = await API.getInfo(msg.author, "players");
                    API.setInfo(msg.author, "players", "saq", obj.saq + 1);
                }
            }
            embedmsg.edit({ embed });
        });
        
        collector.on('end', collected => {
            if (reacted) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria sacar o valor de **${API.format(total)} ${API.money} ${API.moneyemoji}** da sua conta bancária, porém o tempo expirou.`)
            embedmsg.edit({ embed });
            return;
        });

	}
};