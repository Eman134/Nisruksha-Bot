const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addIntegerOption(option => option.setName('quantia').setDescription('Selecione uma quantia para limpar').setRequired(true))

module.exports = {
    name: 'clear',
    aliases: ['limpar', 'purge'],
    category: 'none',
    description: 'none',
    data,
    perm: 5,
	async execute(API, interaction) {

        const quantia = interaction.options.getInteger('quantia');

        if (quantia < 1 || quantia > 100) {
            const embedtemp = await API.sendError(interaction, "Você precisa digitar um número maior do que 0 e menor ou igual á 100!", `limpar 10`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        try {
            await interaction.channel.bulkDelete(quantia).catch()
            await interaction.reply({ content: `Você limpou **${quantia}** mensagens deste canal!`})
        } catch{
        }

	}
};