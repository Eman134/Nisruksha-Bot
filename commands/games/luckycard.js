const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('fichas').setDescription('Selecione uma quantia de fichas para aposta').setRequired(true))

module.exports = {
    name: 'cartasdasorte',
    aliases: ['luckycards'],
    category: 'Jogos',
    description: 'Faça uma aposta e escolha uma carta oculta para multiplicar a mesma',
    data,
    mastery: 3,
	async execute(API, interaction) {

        const Discord = API.Discord;

        const aposta = interaction.options.getInteger('fichas')

        const check = await API.playerUtils.cooldown.check(interaction.user.id, "luckycards");

        if (check) {

            API.playerUtils.cooldown.message(interaction, 'luckycards', 'realizar aposta em cartas da sorte')

            return;
        }

        if (!(API.townExtension.games[await API.townExtension.getTownName(interaction.user.id)].includes('luckycards'))) {
            const embedtemp = await API.sendError(interaction, `A casa de jogos da sua vila não possui o jogo **CARTAS DA SORTE**!\nJogos disponíveis na sua vila: **${API.townExtension.games[await API.townExtension.getTownName(interaction.user.id)].join(', ')}.**`)
			await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (aposta < 20) {
            const embedtemp = await API.sendError(interaction, `A quantia mínima de apostas é de 20 fichas!`, `cartasdasorte 20`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (aposta > 5000) {
            const embedtemp = await API.sendError(interaction, `A quantia máxima de apostas é de 5000 fichas!`, `cartasdasorte <aposta>`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const token = await API.eco.token.get(interaction.user.id)

        if (token < aposta) {
            const embedtemp = await API.sendError(interaction, `Você não possui essa quantia de fichas para apostar!\nCompre suas fichas na loja \`/loja fichas\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const embed = new Discord.MessageEmbed()
        .setColor('#4e5052')
        .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
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

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn0, btn1, btn2, btn3, btn4])], fetchReply: true });

        const filter = i => i.user.id === interaction.user.id;
            
        const collector = await embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (b && !b.deferred) b.deferUpdate().then().catch(console.error);

            reacted = true
            collector.stop();

            embed.fields = []

            const token = await API.eco.token.get(interaction.user.id)

            if (token < aposta) {
                embed.setDescription(`Você não possui essa quantia de fichas para apostar!\nCompre suas fichas na loja \`/loja fichas\``)
                await interaction.editReply({ embeds: [embed], components: []})
                return;
            }

            embed.addField(`Informações de Jogo`, `Você deve escolher dentre as cartas disponíveis, somente uma.\nO sistema sorteia anteriormente (ou seja, as cartas possuem resultado antes mesmo de você clicar) as multiplicações das cartas e, dependendo da carta que você escolher você pode vir com multiplicador de 0.1x-1.5x a sua aposta.\nSua aposta: \`${API.format(aposta)} ${API.money3}\` ${API.money3emoji}\n${Math.round(aposta*cards[b.customId]) < aposta ? '❌ Prejuízo de `' + Math.round(aposta-Math.round(aposta*cards[b.customId])) : '✅ Lucro de `' + Math.round(Math.round(aposta*cards[b.customId])-aposta) } ${API.money3}\` ${API.money3emoji}`, true)

            const btn0 = API.createButton('card1', (b.customId == 'card1' ? (Math.round(aposta*cards[b.customId]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card1'].toString(), '855906056865316895', true)
            const btn1 = API.createButton('card2', (b.customId == 'card2' ? (Math.round(aposta*cards[b.customId]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card2'].toString(), '855906056865316895', true)
            const btn2 = API.createButton('card3', (b.customId == 'card3' ? (Math.round(aposta*cards[b.customId]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card3'].toString(), '855906056865316895', true)
            const btn3 = API.createButton('card4', (b.customId == 'card4' ? (Math.round(aposta*cards[b.customId]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card4'].toString(), '855906056865316895', true)
            const btn4 = API.createButton('card5', (b.customId == 'card5' ? (Math.round(aposta*cards[b.customId]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card5'].toString(), '855906056865316895', true)
            
            interaction.editReply({ embeds: [embed], components: [API.rowComponents([btn0, btn1, btn2, btn3, btn4])] });

            if (Math.round(aposta*cards[b.customId]) > aposta) {
                API.eco.addToHistory(interaction.user.id, `Cartas da Sorte | + ${API.format(Math.round(aposta*cards[b.customId])-aposta)} ${API.money3emoji}`);
                await API.eco.token.add(interaction.user.id, (Math.round(aposta*cards[b.customId])-aposta));
            } else {
                const preju = Math.round(aposta-(aposta*cards[b.customId]))
                API.eco.addToHistory(interaction.user.id, `Cartas da Sorte | - ${API.format(preju)} ${API.money3emoji}`);
                await API.eco.token.remove(interaction.user.id, preju);
                API.eco.token.add(API.id, preju)
            }

        });

        collector.on('end', async collected => {

            API.playerUtils.cooldown.set(interaction.user.id, "luckycards", 0);

            if (reacted) return

            interaction.editReply({ embeds: [embed], components: [] });

            return;
        });
        
        API.playerUtils.cooldown.set(interaction.user.id, "luckycards", 60);
    
    }
};