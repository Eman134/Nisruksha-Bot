const Discord = require('discord.js');
const playersService = require('../../_classes/services/players');
const townsService = require('../../_classes/services/towns');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const economyService = require('../../_classes/services/economy');
const config = require('../../_classes/config');
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('fichas').setDescription('Selecione uma quantia de fichas para aposta').setRequired(true))

const v2Flags = Discord.MessageFlags.IsComponentsV2;

function textContainer(content, color) {
    return new ContainerBuilder()
        .setAccentColor(color)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
}

function errorContainer(interaction, message, usage) {
    return textContainer(`${interaction.user.tag}\n<:error:736274027756388353> ${message}${usage ? `\n\n**Exemplo de uso**\n\`/${usage}\`` : ''}`, 0xb8312c);
}

function cardsContainer({ color, description, info, buttons }) {
    const sections = [`${info.author}\n**<:hide:855906056865316895> Cartas da Sorte**`];
    if (description) sections.push(description);
    if (info.value) sections.push(`**Informações de Jogo**\n${info.value}`);
    const container = textContainer(sections.join('\n\n'), color);
    if (buttons) container.addActionRowComponents(new ActionRowBuilder().addComponents(...buttons));
    return container;
}

module.exports = {
    name: 'cartasdasorte',
    aliases: ['luckycards'],
    category: 'Jogos',
    description: 'Faça uma aposta e escolha uma carta oculta para multiplicar a mesma',
    data,
    mastery: 3,
	async execute(interaction) {

        
        const aposta = interaction.options.getInteger('fichas')

        const check = await playersService.cooldown.check(interaction.user.id, "luckycards");

        if (check) {

            playersService.cooldown.message(interaction, 'luckycards', 'realizar aposta em cartas da sorte')

            return;
        }

        if (!(townsService.games[await townsService.getTownName(interaction.user.id)].includes('luckycards'))) {
            await interaction.reply({ components: [errorContainer(interaction, `A casa de jogos da sua vila não possui o jogo **CARTAS DA SORTE**!\nJogos disponíveis na sua vila: **${townsService.games[await townsService.getTownName(interaction.user.id)].join(', ')}.**`)], flags: v2Flags });
            return;
        }

        if (aposta < 20) {
            await interaction.reply({ components: [errorContainer(interaction, `A quantia mínima de apostas é de 20 fichas!`, `cartasdasorte 20`)], flags: v2Flags });
            return;
        }

        if (aposta > 5000) {
            await interaction.reply({ components: [errorContainer(interaction, `A quantia máxima de apostas é de 5000 fichas!`, `cartasdasorte <aposta>`)], flags: v2Flags });
            return;
        }

        const token = await economyService.token.get(interaction.user.id)

        if (token < aposta) {
            await interaction.reply({ components: [errorContainer(interaction, `Você não possui essa quantia de fichas para apostar!\nCompre suas fichas na loja \`/loja fichas\``)], flags: v2Flags });
            return;
        }
        
        const cards = {
            card1: parseFloat(utility.random(0, 1.5, true).toFixed(2)),
            card2: parseFloat(utility.random(0, 1.5, true).toFixed(2)),
            card3: parseFloat(utility.random(0, 1.5, true).toFixed(2)),
            card4: parseFloat(utility.random(0, 1.5, true).toFixed(2)),
            card5: parseFloat(utility.random(0, 1.5, true).toFixed(2))
        }

        const btn0 = utility.createButton('card1', 'SECONDARY', '', '855906056865316895')
        const btn1 = utility.createButton('card2', 'SECONDARY', '', '855906056865316895')
        const btn2 = utility.createButton('card3', 'SECONDARY', '', '855906056865316895')
        const btn3 = utility.createButton('card4', 'SECONDARY', '', '855906056865316895')
        const btn4 = utility.createButton('card5', 'SECONDARY', '', '855906056865316895')

        const initialInfo = `Você deve escolher dentre as cartas disponíveis, somente uma.\nO sistema sorteia anteriormente (ou seja, as cartas possuem resultado antes mesmo de você clicar) as multiplicações das cartas e, dependendo da carta que você escolher você pode vir com multiplicador de 0.1x-1.5x a sua aposta.\nSua aposta: \`${utility.format(aposta)} ${utility.money3}\` ${utility.money3emoji}`;
        const initialContainer = cardsContainer({ color: 0x4e5052, info: { author: interaction.user.tag, value: initialInfo }, buttons: [btn0, btn1, btn2, btn3, btn4] });
        let embedinteraction = (await interaction.reply({ components: [initialContainer], flags: v2Flags, withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
            
        const collector = await embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.cartas.defer_update'); });

            reacted = true
            collector.stop();

            const token = await economyService.token.get(interaction.user.id)

            if (token < aposta) {
                await interaction.editReply({ components: [cardsContainer({ color: 0x4e5052, description: `Você não possui essa quantia de fichas para apostar!\nCompre suas fichas na loja \`/loja fichas\``, info: { author: interaction.user.tag }, buttons: [] })], flags: v2Flags });
                return;
            }

            const resultInfo = `Você deve escolher dentre as cartas disponíveis, somente uma.\nO sistema sorteia anteriormente (ou seja, as cartas possuem resultado antes mesmo de você clicar) as multiplicações das cartas e, dependendo da carta que você escolher você pode vir com multiplicador de 0.1x-1.5x a sua aposta.\nSua aposta: \`${utility.format(aposta)} ${utility.money3}\` ${utility.money3emoji}\n${Math.round(aposta*cards[b.customId]) < aposta ? '❌ Prejuízo de `' + Math.round(aposta-Math.round(aposta*cards[b.customId])) : '✅ Lucro de `' + Math.round(Math.round(aposta*cards[b.customId])-aposta) } ${utility.money3}\` ${utility.money3emoji}`;

            const btn0 = utility.createButton('card1', (b.customId == 'card1' ? (Math.round(aposta*cards[b.customId]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card1'].toString(), '855906056865316895', true)
            const btn1 = utility.createButton('card2', (b.customId == 'card2' ? (Math.round(aposta*cards[b.customId]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card2'].toString(), '855906056865316895', true)
            const btn2 = utility.createButton('card3', (b.customId == 'card3' ? (Math.round(aposta*cards[b.customId]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card3'].toString(), '855906056865316895', true)
            const btn3 = utility.createButton('card4', (b.customId == 'card4' ? (Math.round(aposta*cards[b.customId]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card4'].toString(), '855906056865316895', true)
            const btn4 = utility.createButton('card5', (b.customId == 'card5' ? (Math.round(aposta*cards[b.customId]) < aposta ? 'DANGER' : 'SUCCESS') : 'SECONDARY'), 'x' + cards['card5'].toString(), '855906056865316895', true)
            
            interaction.editReply({ components: [cardsContainer({ color: 0x4e5052, info: { author: interaction.user.tag, value: resultInfo }, buttons: [btn0, btn1, btn2, btn3, btn4] })], flags: v2Flags });

            if (Math.round(aposta*cards[b.customId]) > aposta) {
                economyService.addToHistory(interaction.user.id, `Cartas da Sorte | + ${utility.format(Math.round(aposta*cards[b.customId])-aposta)} ${utility.money3emoji}`);
                await economyService.token.add(interaction.user.id, (Math.round(aposta*cards[b.customId])-aposta));
            } else {
                const preju = Math.round(aposta-(aposta*cards[b.customId]))
                economyService.addToHistory(interaction.user.id, `Cartas da Sorte | - ${utility.format(preju)} ${utility.money3emoji}`);
                await economyService.token.remove(interaction.user.id, preju);
                economyService.token.add(config.app.id, preju)
            }

        });

        collector.on('end', async collected => {

            playersService.cooldown.set(interaction.user.id, "luckycards", 0);

            if (reacted) return

            interaction.editReply({ components: [initialContainer], flags: v2Flags });

            return;
        });
        
        playersService.cooldown.set(interaction.user.id, "luckycards", 60);
    
    }
};
