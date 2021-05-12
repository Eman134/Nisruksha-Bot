module.exports = {
    name: 'cotação',
    aliases: ['price', 'cotas', 'cot'],
    category: 'Maquinas',
    description: 'Veja a cotação atual de cada unidade para venda',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        
		const embed = new Discord.MessageEmbed()
        .setColor('#32a893')
        .setTitle('📈 Cotação atual dos minérios')
        .setDescription(`${API.maqExtension.ores.obj.minerios.map(m => `${m.icon} 1g de ${m.name.charAt(0).toUpperCase() + m.name.slice(1)} <:arrow:737370913204600853> \`${m.price.atual} ${API.money}\` ${API.moneyemoji} ${m.price.ultimoupdate !== '' ? m.price.ultimoupdate : ''}`).join('\n')}`)
        let footer = ""
        if (API.maqExtension.lastcot !== '') {
           footer += ('Última atualização em ' + API.maqExtension.lastcot)
        }
        if (API.maqExtension.proxcot !== 0) {
            footer += ('\nPróxima atualização em ' + API.ms2(API.maqExtension.proxcot-Date.now()+(60000*20)))
        }
        if (footer != "") embed.setFooter(footer)

        await msg.quote(embed);

	}
};