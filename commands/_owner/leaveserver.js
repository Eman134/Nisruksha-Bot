const clientService = require('../../_classes/services/clientService');
const { SlashCommandBuilder } = require('@discordjs/builders');
const data = new SlashCommandBuilder()
.addStringOption(option => option.setName('server_id').setDescription('Selecione um id de servidor').setRequired(true))

module.exports = {
    name: 'sairsv',
    aliases: ['leaveserver'],
    category: 'none',
    description: 'Faz com que o bot saia de algum servidor',
    data,
    perm: 5,
	async execute(interaction) {

        const server_id = interaction.options.getString('server_id');

        if (clientService.current.guilds.cache.get(server_id) == undefined) return await interaction.reply({ content: 'invalid server' })

        clientService.current.guilds.cache.get(server_id).leave();

        await interaction.reply({ content: 'SUCCESS'})
    }
}