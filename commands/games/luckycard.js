module.exports = {
    name: 'cartasdasorte',
    aliases: ['luckycards'],
    category: 'Jogos',
    description: 'Faça uma aposta e escolha uma carta oculta para multiplicar a mesma',
    options: [{
        name: 'fichas',
        type: 'INTEGER',
        description: 'Selecione uma quantia de fichas para aposta',
        required: true
    }],
    mastery: 5,
	async execute(API, msg) {

        const Discord = API.Discord;
        const client = API.client;
        const args = API.args(msg);

        const check = await API.playerUtils.cooldown.check(msg.author, "luckycards");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'luckycards', 'realizar aposta em cartas da sorte')

            return;
        }

        if (!(API.townExtension.games[await API.townExtension.getTownName(msg.author)].includes('luckycards'))) {
            const embedtemp = await API.sendError(msg, `A casa de jogos da sua vila não possui o jogo **CARTAS DA SORTE**!\nJogos disponíveis na sua vila: **${API.townExtension.games[await API.townExtension.getTownName(msg.author)].join(', ')}.**`)
			await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de fichas para aposta!`, `cartasdasorte 20`)
			await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (!API.isInt(args[0])) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de fichas (NÚMERO) para aposta!`, `cartasdasorte 20`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let aposta = parseInt(args[0]);

        if (aposta < 20) {
            const embedtemp = await API.sendError(msg, `A quantia mínima de apostas é de 20 fichas!`, `cartasdasorte 20`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (aposta > 5000) {
            const embedtemp = await API.sendError(msg, `A quantia máxima de apostas é de 5000 fichas!`, `cartasdasorte <aposta>`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        const token = await API.eco.token.get(msg.author)

        if (token < aposta) {
            const embedtemp = await API.sendError(msg, `Você não possui essa quantia de fichas para apostar!\nCompre suas fichas na loja \`${API.prefix}loja fichas\``)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        const embed = new Discord.MessageEmbed()
        .setColor('#4e5052')
        .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setTitle(`<:hide:855906056865316895> Cartas da Sorte`)
        .addField(`Informações de Jogo`, `Você deve escolher dentre as cartas disponíveis, somente uma.\nO sistema sorteia anteriormente (ou seja, as cartas possuem resultado antes mesmo de você clicar) as multiplicações das cartas e, dependendo da carta que você escolher você pode vir com multiplicador de 0.1x-1.5x a sua aposta.\nSua aposta: \`${API.format(aposta)} ${API.money3}\` ${API.money3emoji}`, true)
        
        const cards = {
            card1: parseFloat(API.random(0, 1.5, true).toFixed(2)),
            card2: parseFloat(API.random(0, 1.5, true).toFixed(2)),
            card3: parseFloat(API.random(0, 1.5, true).toFixed(2)),
            card4: parseFloat(API.random(0, 1.5, true).toFixed(2)),
            card5: parseFloat(API.random(0, 1.5, true).toFixed(2))
        }

        const btn0 = API.createButton('card1', 'SECONDARY', '', '855906056865316895')
        const btn1 = API.createButton('card2', 'SECONDARY', '', '855906056865316895')
        const btn2 = API.createButton('card3', 'SECONDARY', '', '855906056865316895')
        const btn3 = API.createButton('card4', 'SECONDARY', '', '855906056865316895')
        const btn4 = API.createButton('card5', 'SECONDARY', '', '855906056865316895')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowButton([btn0, btn1, btn2, btn3, btn4])] });

        const filter = i => i.user.id === msg.author.id;
            
        const collector = await embedmsg.createMessageComponentInteractionCollector({ filter, time: 30000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === msg.author.id)) return
            b.deferUpdate().catch()

            reacted = true
            collector.stop();

            embed.fields = []

            const token = await API.eco.token.get(msg.author)

            if (token < aposta) {
                embed.setDescription(`Você não possui essa quantia de fichas para apostar!\nCompre suas fichas na loja \`${API.prefix}loja fichas\``)
                await embedmsg.edit({ embeds: [embed], components: []})
                return;
            }

            embed.addField(`Informações de Jogo`, `Você deve escolher dentre as cartas disponíveis, somente uma.\nO sistema sorteia anteriormente (ou seja, as cartas possuem resultado antes mesmo de você clicar) as multiplicações das cartas e, dependendo da carta que você escolher você pode vir com multiplicador de 0.1x-1.5x a sua aposta.\nSua aposta: \`${API.format(aposta)} ${API.money3}\` ${API.money3emoji}\n${Math.round(aposta*cards[b.customID]) < aposta ? '❌ Prejuízo de `' + Math.round(aposta-Math.round(aposta*cards[b.customID])) : '✅ Lucro de `' + Math.round(Math.round(aposta*cards[b.customID])-aposta) } ${API.money3}\` ${API.money3emoji}`, true)

            const btn0 = API.createButton('card1', (b.customID == 'card1' ? (Math.round(aposta*cards[b.customID]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card1'].toString(), '855906056865316895', true)
            const btn1 = API.createButton('card2', (b.customID == 'card2' ? (Math.round(aposta*cards[b.customID]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card2'].toString(), '855906056865316895', true)
            const btn2 = API.createButton('card3', (b.customID == 'card3' ? (Math.round(aposta*cards[b.customID]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card3'].toString(), '855906056865316895', true)
            const btn3 = API.createButton('card4', (b.customID == 'card4' ? (Math.round(aposta*cards[b.customID]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card4'].toString(), '855906056865316895', true)
            const btn4 = API.createButton('card5', (b.customID == 'card5' ? (Math.round(aposta*cards[b.customID]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card5'].toString(), '855906056865316895', true)
            
            embedmsg.edit({ embeds: [embed], components: [API.rowButton([btn0, btn1, btn2, btn3, btn4])] });

            if (Math.round(aposta*cards[b.customID]) > aposta) {
                API.eco.addToHistory(msg.author, `Cartas da Sorte | + ${API.format(Math.round(aposta*cards[b.customID])-aposta)} ${API.money3emoji}`);
                await API.eco.token.add(msg.author, (Math.round(aposta*cards[b.customID])-aposta));
            } else {
                API.eco.addToHistory(msg.author, `Cartas da Sorte | - ${API.format(Math.round(aposta-(aposta*cards[b.customID])))} ${API.money3emoji}`);
                await API.eco.token.remove(msg.author, Math.round(aposta-(aposta*cards[b.customID])));
            }

        });

        collector.on('end', async collected => {

            API.playerUtils.cooldown.set(msg.author, "luckycards", 0);

            if (reacted) return

            embedmsg.edit({ embeds: [embed], components: [] });

            return;
        });
        
        API.playerUtils.cooldown.set(msg.author, "luckycards", 60);
    
    }
};