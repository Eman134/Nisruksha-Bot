module.exports = {
    name: 'ping',
    category: 'Outros',
    description: 'Veja a latência atual do bot',
	async execute(API, msg) {
        
		const boolean = await API.checkAll(msg);
        if (boolean) return;
        
        const Discord = API.Discord;
        const client = API.client;

		const embed = new Discord.MessageEmbed()
	    .setColor('#32a893')
        .setDescription('🏓 Latência: ' + client.ws.ping + ' ms')
     await msg.quote(embed);

	}
};