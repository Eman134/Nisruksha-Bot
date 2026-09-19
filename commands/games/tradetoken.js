const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const economyService = require('../../_classes/services/economy');
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { reportError } = require('../../_classes/debug');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('fichas').setDescription('Digite a quantia de fichas que deseja trocar').setRequired(true))

const v2Flags = Discord.MessageFlags.IsComponentsV2;

function textContainer(content, color) {
    return new ContainerBuilder()
        .setAccentColor(color)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
}

function errorContainer(interaction, message, usage) {
    return textContainer(`${interaction.user.tag}\n<:error:736274027756388353> ${message}${usage ? `\n\n**Exemplo de uso**\n\`/${usage}\`` : ''}`, 0xb8312c);
}

module.exports = {
    name: 'trocarfichas',
    aliases: ['tfichas', 'tf'],
    category: 'Jogos',
    description: 'Troca as suas fichas por uma quantia de dinheiro',
    data,
    mastery: 10,
	async execute(interaction) {

                
        const fichas = interaction.options.getInteger('fichas');

        if (fichas < 20) {
            await interaction.reply({ components: [errorContainer(interaction, `A quantia mínima de fichas para troca é 20 fichas!`)], flags: v2Flags });
            return;
        }
		
	const token = await economyService.token.get(interaction.user.id)

        if (token < aposta) {
            await interaction.reply({ components: [errorContainer(interaction, `Você não possui \`${aposta} ${utility.money3}\` ${utility.money3emoji} para trocar `)], flags: v2Flags });
            return;
        }

        let total = fichas*810;
        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        const buildTradeContainer = (color, title, value) => textContainer(`**${title}**\n${value}`, color);
        let embedinteraction = (await interaction.reply({
            components: [buildTradeContainer(0x32a893, '<a:loading:736625632808796250> Aguardando confirmação', `Você deseja trocar ${utility.format(fichas)} ${utility.money3} ${utility.money3emoji} pelo valor de ${utility.format(total)} ${utility.money} ${utility.moneyemoji}?`)
                .addActionRowComponents(new ActionRowBuilder().addComponents(btn0, btn1))],
            flags: v2Flags,
            withResponse: true
        })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });

        let reacted = false;
        
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.trocartokens.defer_update'); });
            reacted = true;
            collector.stop();
		
	const token = await economyService.token.get(interaction.user.id)

        if (token < aposta) {
            await interaction.followUp({ components: [errorContainer(interaction, `Você não possui \`${aposta} ${utility.money3}\` ${utility.money3emoji} para trocar `)], flags: v2Flags });
            return;
        }
		
            if (b.customId == 'cancel'){
                collector.stop();
                interaction.editReply({ components: [buildTradeContainer(0xa60000, '❌ Troca cancelada', `Você cancelou a troca de ${utility.format(fichas)} ${utility.money3} ${utility.money3emoji} pelo valor de ${utility.format(total)} ${utility.money} ${utility.moneyemoji}.`)], flags: v2Flags });
                return;
            } else {
                await interaction.editReply({ components: [buildTradeContainer(0x5bff45, '✅ Sucesso na troca', `Você trocou ${utility.format(fichas)} ${utility.money3} ${utility.money3emoji} pelo valor de ${utility.format(total)} ${utility.money} ${utility.moneyemoji}`)], flags: v2Flags });
                await economyService.token.remove(interaction.user.id, fichas)
                await economyService.money.add(interaction.user.id, total)
                await economyService.addToHistory(interaction.user.id, `Troca | - ${utility.format(fichas)} ${utility.money3emoji} : + ${utility.format(total)} ${utility.moneyemoji}`)
            }
        });
        
        collector.on('end', collected => {
            if (reacted) return
            interaction.editReply({ components: [buildTradeContainer(0xa60000, '❌ Tempo expirado', `Você iria trocar ${fichas} ${utility.money3} ${utility.money3emoji} pelo valor de ${total} ${utility.money} ${utility.moneyemoji}, porém o tempo expirou!`)], flags: v2Flags });
            return;
        });

	}
};
