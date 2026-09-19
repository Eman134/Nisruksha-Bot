const { SlashCommandBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('fichas').setDescription('Selecione uma quantia de fichas para aposta').setRequired(true))

module.exports = {
    requiredServices: ["Discord","createButton","eco","format","id","money3","money3emoji","playerUtils","random","rowComponents","sendError","townExtension"],
    name: 'cartasdasorte',
    aliases: ['luckycards'],
    category: 'Jogos',
    description: 'Faça uma aposta e escolha uma carta oculta para multiplicar a mesma',
    data,
    mastery: 3,
	async execute(interaction, svcDiscord, svcCreateButton, svcEco, svcFormat, svcId, svcMoney3, svcMoney3emoji, svcPlayerUtils, svcRandom, svcRowComponents, svcSendError, svcTownExtension) {
        const aposta = interaction.options.getInteger('fichas')

        const check = await svcPlayerUtils.cooldown.check(interaction.user.svcId, "luckycards");

        if (check) {

            svcPlayerUtils.cooldown.message(interaction, 'luckycards', 'realizar aposta em cartas da sorte')

            return;
        }

        if (!(svcTownExtension.games[await svcTownExtension.getTownName(interaction.user.svcId)].includes('luckycards'))) {
            const embedtemp = await svcSendError(interaction, `A casa de jogos da sua vila não possui o jogo **CARTAS DA SORTE**!\nJogos disponíveis na sua vila: **${svcTownExtension.games[await svcTownExtension.getTownName(interaction.user.svcId)].join(', ')}.**`)
			await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (aposta < 20) {
            const embedtemp = await svcSendError(interaction, `A quantia mínima de apostas é de 20 fichas!`, `cartasdasorte 20`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (aposta > 5000) {
            const embedtemp = await svcSendError(interaction, `A quantia máxima de apostas é de 5000 fichas!`, `cartasdasorte <aposta>`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const token = await svcEco.token.get(interaction.user.svcId)

        if (token < aposta) {
            const embedtemp = await svcSendError(interaction, `Você não possui essa quantia de fichas para apostar!\nCompre suas fichas na loja \`/loja fichas\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        const embed = new svcDiscord.MessageEmbed()
        .setColor('#4e5052')
        .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ svcFormat: 'png', dynamic: true, size: 1024 }))
        .setTitle(`<:hide:855906056865316895> Cartas da Sorte`)
        .addField(`Informações de Jogo`, `Você deve escolher dentre as cartas disponíveis, somente uma.\nO sistema sorteia anteriormente (ou seja, as cartas possuem resultado antes mesmo de você clicar) as multiplicações das cartas e, dependendo da carta que você escolher você pode vir com multiplicador de 0.1x-1.5x a sua aposta.\nSua aposta: \`${svcFormat(aposta)} ${svcMoney3}\` ${svcMoney3emoji}`, true)
        
        const cards = {
            card1: parseFloat(svcRandom(0, 1.5, true).toFixed(2)),
            card2: parseFloat(svcRandom(0, 1.5, true).toFixed(2)),
            card3: parseFloat(svcRandom(0, 1.5, true).toFixed(2)),
            card4: parseFloat(svcRandom(0, 1.5, true).toFixed(2)),
            card5: parseFloat(svcRandom(0, 1.5, true).toFixed(2))
        }

        const btn0 = svcCreateButton('card1', 'SECONDARY', '', '855906056865316895')
        const btn1 = svcCreateButton('card2', 'SECONDARY', '', '855906056865316895')
        const btn2 = svcCreateButton('card3', 'SECONDARY', '', '855906056865316895')
        const btn3 = svcCreateButton('card4', 'SECONDARY', '', '855906056865316895')
        const btn4 = svcCreateButton('card5', 'SECONDARY', '', '855906056865316895')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1, btn2, btn3, btn4])], withResponse: true });

        const filter = i => i.user.svcId === interaction.user.svcId;
            
        const collector = await embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.cartas.defer_update'); });

            reacted = true
            collector.stop();

            embed.fields = []

            const token = await svcEco.token.get(interaction.user.svcId)

            if (token < aposta) {
                embed.setDescription(`Você não possui essa quantia de fichas para apostar!\nCompre suas fichas na loja \`/loja fichas\``)
                await interaction.editReply({ embeds: [embed], components: []})
                return;
            }

            embed.addField(`Informações de Jogo`, `Você deve escolher dentre as cartas disponíveis, somente uma.\nO sistema sorteia anteriormente (ou seja, as cartas possuem resultado antes mesmo de você clicar) as multiplicações das cartas e, dependendo da carta que você escolher você pode vir com multiplicador de 0.1x-1.5x a sua aposta.\nSua aposta: \`${svcFormat(aposta)} ${svcMoney3}\` ${svcMoney3emoji}\n${Math.round(aposta*cards[b.customId]) < aposta ? '❌ Prejuízo de `' + Math.round(aposta-Math.round(aposta*cards[b.customId])) : '✅ Lucro de `' + Math.round(Math.round(aposta*cards[b.customId])-aposta) } ${svcMoney3}\` ${svcMoney3emoji}`, true)

            const btn0 = svcCreateButton('card1', (b.customId == 'card1' ? (Math.round(aposta*cards[b.customId]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card1'].toString(), '855906056865316895', true)
            const btn1 = svcCreateButton('card2', (b.customId == 'card2' ? (Math.round(aposta*cards[b.customId]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card2'].toString(), '855906056865316895', true)
            const btn2 = svcCreateButton('card3', (b.customId == 'card3' ? (Math.round(aposta*cards[b.customId]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card3'].toString(), '855906056865316895', true)
            const btn3 = svcCreateButton('card4', (b.customId == 'card4' ? (Math.round(aposta*cards[b.customId]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card4'].toString(), '855906056865316895', true)
            const btn4 = svcCreateButton('card5', (b.customId == 'card5' ? (Math.round(aposta*cards[b.customId]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card5'].toString(), '855906056865316895', true)
            
            interaction.editReply({ embeds: [embed], components: [svcRowComponents([btn0, btn1, btn2, btn3, btn4])] });

            if (Math.round(aposta*cards[b.customId]) > aposta) {
                svcEco.addToHistory(interaction.user.svcId, `Cartas da Sorte | + ${svcFormat(Math.round(aposta*cards[b.customId])-aposta)} ${svcMoney3emoji}`);
                await svcEco.token.add(interaction.user.svcId, (Math.round(aposta*cards[b.customId])-aposta));
            } else {
                const preju = Math.round(aposta-(aposta*cards[b.customId]))
                svcEco.addToHistory(interaction.user.svcId, `Cartas da Sorte | - ${svcFormat(preju)} ${svcMoney3emoji}`);
                await svcEco.token.remove(interaction.user.svcId, preju);
                svcEco.token.add(svcId, preju)
            }

        });

        collector.on('end', async collected => {

            svcPlayerUtils.cooldown.set(interaction.user.svcId, "luckycards", 0);

            if (reacted) return

            interaction.editReply({ embeds: [embed], components: [] });

            return;
        });
        
        svcPlayerUtils.cooldown.set(interaction.user.svcId, "luckycards", 60);
    
    }
};
