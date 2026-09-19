const Discord = require('../../_classes/discordCompat');
const clientService = require('../../_classes/services/clientService');
module.exports = {
    name: 'ping',
    category: 'Outros',
    description: 'Veja a latência atual do bot',
    mastery: 5,
	async execute(interaction) {
        
                
		const embed = new Discord.MessageEmbed()
	    .setColor('#32a893')
        .setDescription('🏓 Latência: ' + client.ws.ping + ' ms')

        await interaction.reply({ embeds: [embed] });

	}
};