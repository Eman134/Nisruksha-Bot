module.exports = {
    name: 'tutorial',
    aliases: ['site', 'wiki'],
    category: 'Outros',
    description: 'Saiba todas as informações de cada comando e como usar o bot!',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        
		const embed = new Discord.MessageEmbed()
                .setColor('#36393f')
                .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                .setDescription('Para entrar no site [CLIQUE AQUI](https://eman134.github.io/nisruksha/)\nOBS: Para qualquer informação que esteja faltando no site, contate os moderadores do bot!')
             await msg.quote(embed);

	}
};