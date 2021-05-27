module.exports = {
    name: 'ping',
    category: 'Outros',
    description: 'Veja a latência atual do bot',
	async execute(API, msg) {
        
		const boolean = await API.checkAll(msg);
        if (boolean) return;
        
        const Discord = API.Discord;
        const client = API.client;

        let btn = API.createButton('https://discord.com/channels/693150851396796446/703293776788979812/847231089398251541', 'url', 'Mineração')

        let btn2 = API.createButton('testeBtn', 'blurple', 'Teste')

        let embed = new API.Discord.MessageEmbed()
        .setDescription('Oi Best!');

        await msg.quote({ embed, buttons: [btn, btn2]});

        //if () x.edit({ embed, buttons: [btn, btn2]});

		/*const embed = new Discord.MessageEmbed()
	    .setColor('#32a893')
        .setDescription('🏓 Latência: ' + client.ws.ping + ' ms')
        await msg.quote(embed);*/

	}
};