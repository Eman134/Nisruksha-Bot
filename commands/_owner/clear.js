const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('quantia').setDescription('Selecione uma quantia para limpar').setRequired(true))

module.exports = {
    name: 'clear',
    aliases: ['limpar', 'purge'],
    category: 'none',
    description: 'none',
    data,
    perm: 5,
	async execute(interaction) {

        const quantia = interaction.options.getInteger('quantia');

        if (quantia < 1 || quantia > 100) {
            const container = new ContainerBuilder().setAccentColor(0xb8312c).addTextDisplayComponents(new TextDisplayBuilder().setContent(`<:error:736274027756388353> ${interaction.user.tag}\nVocê precisa digitar um número maior do que 0 e menor ou igual á 100!\n\n**Exemplo de uso**\n\`/limpar 10\``));
            await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        try {
            await interaction.channel.bulkDelete(quantia).catch((error) => reportError(error, 'command.clear.bulk_delete'))
            await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Você limpou **${quantia}** mensagens deste canal!`)], flags: Discord.MessageFlags.IsComponentsV2 })
        } catch (error) {
            reportError(error, 'command.clear', { channelId: interaction.channel.id });
        }

	}
};
