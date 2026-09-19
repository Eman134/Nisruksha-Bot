const clientService = require('../../_classes/services/clientService');
const config = require('../../_classes/config');
const Discord = require('discord.js');
const { TextDisplayBuilder } = require('@discordjs/builders');
module.exports = {
    name: 'reloadslash',
    aliases: ['loadslash', 'reloadsl'],
    category: 'none',
    description: 'Dá reload nos comandos de slash',
    options: [],
	async execute(interaction) {

        clientService.current.loadSlashCommands({ force: true, id: config.app.id })

        interaction.reply({ components: [new TextDisplayBuilder().setContent('Comandos de Slash foram recarregados com sucesso!')], flags: Discord.MessageFlags.IsComponentsV2 })

    }
};
