module.exports = {
    name: 'sobremim',
    aliases: ['biografia', 'biography', 'sobre', 'bio', 'sobre-mim'],
    category: 'Social',
    description: 'Defina a sua biografia que aparece no perfil',
    options: [{
        name: 'texto',
        type: 'STRING',
        description: 'Escreva uma pequena biografia sobre você',
        required: true,
    }],
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;

        const args = API.args(msg);

        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, 'Você não definiu um texto sobre você', 'sobremim <texto>')
            await msg.quote(embedtemp)
            return;
        }
        if (API.getMultipleArgs(msg, 1).length > 50) {
            const embedtemp = await API.sendError(msg, 'Você não pode colocar um sobre com mais de 50 caracteres\nQuantia de caracteres da sua biografia: ' + API.getMultipleArgs(msg, 1).length + '/50', 'sobremim <texto>')
            await msg.quote(embedtemp)
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