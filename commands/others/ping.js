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

        const button1 = API.createButton('tst1', 'SUCCESS', 'teste')
        const button2 = new Discord.MessageButton()
        .setCustomID('PRIMARY')
        .setLabel('PRIMARY')
        .setStyle('PRIMARY')

        const component0 = API.rowButton([button1])

        console.log(button1)
        console.log(button2)

        const row = new Discord.MessageActionRow()
			.addComponents(button1,)

        await msg.quote({ embeds: [embed], components: [row] });

	}
};