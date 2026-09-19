const Discord = require('../../_classes/discordCompat');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
module.exports = {
    name: 'convite',
    aliases: ['invite', 'convidar', 'suporte'],
    category: 'Outros',
    description: 'Visualize meus links próprios para votar, me convidar ou meu servidor',
    mastery: 5,
	async execute(interaction) {

        const embed = new Discord.MessageEmbed()
        .setColor('#36393f')
        .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        .setDescription(`Olá ${interaction.user}` + ', meu prefixo é `/`, caso precise de ajuda use `/ajuda`')

        const btn1 = utility.createButton('https://discord.com/invite/jK3eNA5GkM', 'LINK', 'Meu servidor', '📨')
        const btn2 = utility.createButton('https://discord.com/oauth2/authorize?client_id=763815343507505183&permissions=388160&scope=bot%20applications.commands', 'LINK', 'Convidar', '📩')
        const btn3 = utility.createButton('https://top.gg/bot/763815343507505183', 'LINK', 'Vote em mim', '🗳')
            
        return await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn1, btn2, btn3])] });

	}
};