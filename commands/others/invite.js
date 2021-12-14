module.exports = {
    name: 'convite',
    aliases: ['invite', 'convidar', 'suporte'],
    category: 'Outros',
    description: 'Visualize meus links próprios para votar, me convidar ou meu servidor',
    mastery: 5,
	async execute(API, interaction) {

        const embed = new API.Discord.MessageEmbed()
        .setColor('#36393f')
        .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setDescription(`Olá ${interaction.user}` + ', meu prefixo é `/`, caso precise de ajuda use `/ajuda`')

        const btn1 = API.createButton('https://discord.com/invite/jK3eNA5GkM', 'LINK', 'Meu servidor', '📨')
        const btn2 = API.createButton('https://discord.com/oauth2/authorize?client_id=763815343507505183&permissions=388160&scope=bot%20applications.commands', 'LINK', 'Convidar', '📩')
        const btn3 = API.createButton('https://top.gg/bot/763815343507505183', 'LINK', 'Vote em mim', '🗳')
            
        return await interaction.reply({ embeds: [embed], components: [API.rowComponents([btn1, btn2, btn3])] });

	}
};