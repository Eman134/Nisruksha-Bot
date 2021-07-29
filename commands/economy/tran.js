module.exports = {
    name: 'transferir',
    aliases: ['tn', 'pay'],
    category: 'Economia',
    description: 'Transfere uma quantia de dinheiro para outro jogador',
    options: [{
        name: 'membro',
        type: 'USER',
        description: 'Selecione um membro para realizar a transferência',
        required: true
    },
    {
        name: 'quantia',
        type: 'INTEGER',
        description: 'Selecione uma quantia de dinheiro para transferência',
        required: true
    }],
    mastery: 50,
	async execute(API, msg) {

        const args = API.args(msg);

        if (msg.mentions.users.size < 1) {
            const embedtemp = await API.sendError(msg, `Você precisa mencionar um player para transferência!`, `transferir @membro <quantia | tudo>`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }
        const member = msg.mentions.users.first();
        
        if (member.id == msg.author.id) {
            const embedtemp = await API.sendError(msg, 'Você precisa mencionar outra pessoa para transferir', 'transferir @membro <quantia | tudo>')
            await msg.quote({ embeds: [embedtemp]})
            return
        }

        if (args.length < 2) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de dinheiro para transferir!`, `transferir @membro <quantia | tudo>`)
            await msg.quote({ embeds: [embedtemp]})
			return;
        }
        const money = await API.eco.bank.get(msg.author)
        let total = 0;
        if (args[1] != 'tudo') {

            if (!API.isInt(API.toNumber(args[1]))) {
                const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de dinheiro (NÚMERO) para transferir!`, `transferir @membro <quantia | tudo>`)
                await msg.quote({ embeds: [embedtemp]})
                return;
            }

            if (money < API.toNumber(args[1])) {
                const embedtemp = await API.sendError(msg, `Você não possui essa quantia de dinheiro __no banco__ para transferir!\nUtilize \`${API.prefix}depositar\` para depositar dinheiro no banco`)
                await msg.quote({ embeds: [embedtemp]})
                return;
            }

            if (API.toNumber(args[1]) < 1) {
                const embedtemp = await API.sendError(msg, `Você não pode transferir essa quantia de dinheiro!`)
                await msg.quote({ embeds: [embedtemp]})
                return;
            }
            total = API.toNumber(args[1])
        } else {
            if (money < 1) {
                const embedtemp = await API.sendError(msg, `Você não possui dinheiro __no banco__ para transferir!`)
                await msg.quote({ embeds: [embedtemp]})
                return;
            }
            total = money;
        }

        const Discord = API.Discord;
        const client = API.client;

        const check = await API.playerUtils.cooldown.check(msg.author, "transferir");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'transferir', 'usar outro comando de transferir')

            return;
        }
        

        const check2 = await API.playerUtils.cooldown.check(member, "receivetr");
        if (check2) {

            let cooldown = await API.playerUtils.cooldown.get(member, "receivetr");
            const embed = new Discord.MessageEmbed()
            .setColor('#b8312c')
            .setDescription('❌ Este membro já recebeu uma transferência nas últimas 12 horas!\nAguarde mais `' + API.ms(cooldown) + '` para fazer uma transferência para ele!')
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
            await msg.quote({ embeds: [embed] });
            return;
        }

        let memberobj = await API.getInfo(member, "machines")
        let nivel = memberobj.level
        let mat = Math.round(Math.pow(nivel, 2) * 500);
        
        if (total > mat) {
            const embedtemp = await API.sendError(msg, `O limite de transferência recebido por ${member} é de ${API.format(mat)} ${API.money} ${API.moneyemoji}!`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        API.playerUtils.cooldown.set(msg.author, "transferir", 20);
        
		const embed = new API.Discord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))

        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja transferir o valor de **${API.format(total)} ${API.money} ${API.moneyemoji}** para ${member}?`)

        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowComponents([btn0, btn1])] });

        const filter = i => i.user.id === msg.author.id;
        

        const collector = embedmsg.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === msg.author.id)) return
if (!b.deferred) b.deferUpdate().then().catch();
            reacted = true;
            collector.stop();
            if (b.customId == 'cancel'){
                embed.fields = [];
                embed.setColor('#a60000');
                embed.addField('❌ Transferência cancelado', `
                Você cancelou a transferência de **${API.format(total)} ${API.money} ${API.moneyemoji}** para ${member}.`)
            } else {
                const money2 = await API.eco.bank.get(msg.author);
                if (money2 < total) {
                    embed.fields = [];
                    embed.setColor('#a60000');
                    embed.addField('❌ Falha na transferência', `Você não possui **${API.format(total)} ${API.money} ${API.moneyemoji}** __no banco__ para transferir!`)
                } else {
                    embed.fields = [];
                    embed.setColor('#5bff45');
                    embed.addField('✅ Sucesso na transferência', `
                    Você transferiu o valor de **${API.format(total)} ${API.money} ${API.moneyemoji}** para ${member} com sucesso!`)
                    API.eco.bank.remove(msg.author, total);
                    API.eco.bank.add(member, total);
                    API.eco.addToHistory(msg.author, `📤 Transferência para ${member} | - ${API.format(total)} ${API.moneyemoji}`)
                    API.eco.addToHistory(member, `📥 Transferência de ${msg.author} | + ${API.format(total)} ${API.moneyemoji}`)
                    let obj = await API.getInfo(msg.author, "players");
                    API.setInfo(msg.author, "players", "tran", obj.tran + 1);
                    if (total > mat/2.5) {
                        API.playerUtils.cooldown.set(member, "receivetr", 43200);
                    }
                }
            }
            API.playerUtils.cooldown.set(msg.author, "transferir", 0);
            embedmsg.edit({ embeds: [embed], components: [] });
        });
        
        collector.on('end', collected => {
            if (reacted) return
            API.playerUtils.cooldown.set(msg.author, "transferir", 0);
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria transferir o valor de **${API.format(total)} ${API.money} ${API.moneyemoji}** para ${member}, porém o tempo expirou.`)
            embedmsg.edit({ embeds: [embed], components: [] });
            return;
        });

	}
};