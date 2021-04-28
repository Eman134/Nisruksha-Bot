module.exports = {
    name: 'convite',
    aliases: ['invite', 'convidar', 'suporte'],
    category: 'Outros',
    description: 'Visualize meus links próprios para votar, me convidar ou meu servidor',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        
		const embed = new Discord.MessageEmbed()
                .setColor('#36393f')
                .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                .setDescription(`Olá ${msg.author}` + ', meu prefixo é `' + API.prefix + '`, caso precise de ajuda use `' + API.prefix + 'ajuda`')
                .addField(
                    '**Mais informações**', 
                    `📨 [Entre em meu servidor](https://dsc.gg/svnisru)\n🗳 [Vote para ajudar o bot](https://top.gg/bot/763815343507505183)\n📩 [Convide-me para seu servidor](https://dsc.gg/nisru)`)
        await msg.quote(embed);

	}
};