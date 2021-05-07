module.exports = {
    name: 'sobremim',
    aliases: ['biografia', 'biography', 'sobre', 'bio', 'sobre-mim'],
    category: 'Social',
    description: 'Defina a sua biografia que aparece no perfil',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;

        const args = API.args(msg);

        if (args.length == 0) {
            API.sendError(msg, 'Você não definiu um texto sobre você', 'sobremim <texto>')
            return;
        }
        if (API.getMultipleArgs(msg, 1).length > 50) {
            API.sendError(msg, 'Você não pode colocar um sobre com mais de 50 caracteres\nQuantia de caracteres da sua biografia: ' + API.getMultipleArgs(msg, 1).length + '/50', 'sobremim <texto>')
            return;
        }
        API.setInfo(msg.member, "players", "bio", API.getMultipleArgs(msg, 1))
		const embed = new Discord.MessageEmbed()
	    .setColor('#8adb5e')
        .setDescription(`Sua biografia foi definida para:
        \`\`\`${API.getMultipleArgs(msg, 1)}\`\`\``)
        .setFooter('Quantia de caracteres da sua biografia: ' + API.getMultipleArgs(msg, 1).length + '/50')
     await msg.quote(embed);

	}
};