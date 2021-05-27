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

        let btn2 = API.createButton('testeBtn', 'green', 'Teste')

        let embed = new API.Discord.MessageEmbed()
        .setDescription('Oi Best!');

        msg.quote({ mention: false, embed, buttons: [btn2, btn] });
        /*
		const embed = new Discord.MessageEmbed()
	    .setColor('#32a893')
        .setDescription('🏓 Latência: ' + client.ws.ping + ' ms')
        await msg.quote(embed);*/

	}
};