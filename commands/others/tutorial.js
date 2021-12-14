module.exports = {
    name: 'tutorial',
    aliases: ['site', 'wiki'],
    category: 'Outros',
    description: 'Saiba todas as informações de cada comando e como usar o bot!',
    mastery: 5,
	async execute(API, interaction) {

        const Discord = API.Discord;
        
		const embed = new Discord.MessageEmbed()
                .setColor('#36393f')
                .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                .setDescription('Para entrar no site [CLIQUE AQUI](https://eman134.github.io/nisruksha/)\nOBS: Para qualquer informação que esteja faltando no site, contate os moderadores do bot!')
             await interaction.reply({ embeds: [embed] });

	}
};