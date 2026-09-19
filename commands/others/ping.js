const Discord = require('discord.js');
const clientService = require('../../_classes/services/clientService');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
module.exports = {
    name: 'ping',
    category: 'Outros',
    description: 'Veja a latência atual do bot',
    mastery: 5,
	async execute(interaction) {
        
                
		const container = new ContainerBuilder()
	    .setAccentColor(0x32a893)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('🏓 Latência: ' + client.ws.ping + ' ms'));

        await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });

	}
};
