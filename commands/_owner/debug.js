const runtime = require('../../_classes/services/runtime');
const Discord = require('discord.js');
const { TextDisplayBuilder } = require('@discordjs/builders');
module.exports = {
    name: 'debug',
    aliases: [],
    category: 'none',
    description: 'none',
    perm: 5,
	async execute(interaction) {

        await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Debug foi setado para ${!runtime.debug}`)], flags: Discord.MessageFlags.IsComponentsV2 })
        
        runtime.debug = !runtime.debug

	}
};
