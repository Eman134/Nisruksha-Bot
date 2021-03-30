module.exports = {
    name: 'votar',
    aliases: ['vote', 'upvote'],
    category: 'Outros',
    description: 'Vote para ajudar no crescimento do bot e resgate recompensas',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        
		const embed = new Discord.MessageEmbed()
                .setColor('#36393f')
                .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                .setDescription('Votando no bot você nos ajudará com o crescimento do mesmo, além de você também ser recompensado!')
                .addField('**Zuraaa**', `🗳 [Clique aqui](https://zuraaa.com/bots/763815343507505183/)\n**Recompensas:**\n1x 📦 Caixa Comum`)
                .addField('**Top.gg**', `🗳 [Clique aqui](https://top.gg/bot/763815343507505183)\n**Recompensas:**\n1x ${API.money2} ${API.money2emoji}`)
                msg.quote(embed);

	}
};