module.exports = {
    name: 'ping',
    category: 'Outros',
    description: 'Veja a latência atual do bot',
    mastery: 5,
	async execute(API, msg) {
        
        const Discord = API.Discord;
        const client = API.client;

		const embed = new Discord.MessageEmbed()
	    .setColor('#32a893')
        .setDescription('🏓 Latência: ' + client.ws.ping + ' ms')
        await msg.quote(embed);

	}
};