module.exports = {
    name: 'recompensascaixa',
    aliases: ['recomcaixa', 'boxrewards', 'recc'],
    category: 'Players',
    description: 'Visualiza as recompensas de uma caixa misteriosa da sua mochila',
    options: [{
        name: 'id-caixa',
        type: 'STRING',
        description: 'Escreva o id da caixa da sua mochila para visualizar as recompensas da mesma',
        required: false
    }],
    mastery: 10,
	async execute(API, msg) {

        const Discord = API.Discord;
        const args = API.args(msg);

        if (args.length == 0) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar um id de caixa para visualizar as recompensas!\nUtilize \`${API.prefix}mochila\` para visualizar suas caixas`, `recc 1`)
            await msg.quote(embedtemp)
			return;
        }

        if (!API.isInt(args[0])) {
            const embedtemp = await API.sendError(msg, `Você não possui uma caixa com este id!\nUtilize \`${API.prefix}mochila\` para visualizar suas caixas`, `recc 1`)
            await msg.quote(embedtemp)
			return;
        }

        const obj = await API.getInfo(msg.author, 'storage');
        const id = parseInt(args[0]);

        if (obj[`crate:${id}`] == null || obj[`crate:${id}`] < 1 || obj[`crate:${id}`] == undefined) {
            const embedtemp = await API.sendError(msg, `Você não possui uma caixa com este id!\nUtilize \`${API.prefix}mochila\` para visualizar suas caixas`, `recc 1`)
            await msg.quote(embedtemp)
			return;
        }

        const crateobj = API.crateExtension.obj[id.toString()]
        let rewardsmap = "Esta caixa possui recompensas randômicas... Nunca se sabe o que pode vir dela."

        if (typeof crateobj.rewards != 'string') {
            
            rewardsmap = API.crateExtension.obj[id.toString()].rewards.sort(function(a, b){
                return b.chance - a.chance;
            }).map(r => `${r.icon} ${r.name} - \`(Chance de ${r.chance}%)\``).join('\n');

        }
        
		const embed = new Discord.MessageEmbed()
	    .setColor('#606060')
        .setDescription(`🏅 Recompensas disponíveis\n \n${rewardsmap}`)
        .setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
     await msg.quote(embed);

	}
};