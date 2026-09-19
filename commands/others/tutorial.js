const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
module.exports = {
    name: 'tutorial',
    aliases: ['site', 'wiki'],
    category: 'Outros',
    description: 'Saiba todas as informações de cada comando e como usar o bot!',
    mastery: 5,
	async execute(interaction) {

                
		const container = new ContainerBuilder()
                .setAccentColor(0x36393f)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent([
                    `**${interaction.user.tag}**`,
                    'Para entrar no site [CLIQUE AQUI](https://eman134.github.io/nisruksha/)\nOBS: Para qualquer informação que esteja faltando no site, contate os moderadores do bot!'
                ].join('\n\n')));
             await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });

	}
};
