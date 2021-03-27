module.exports = {
    name: 'cotação',
    aliases: ['price', 'cotas', 'cot'],
    category: 'Maquinas',
    description: 'Veja a cotação atual de cada unidade para venda',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;
        
		const embed = new Discord.MessageEmbed()
        .setColor('#32a893')
        .setDescription(`**📈 Cotação atual dos minérios**\n${API.maqExtension.ores.getObj().minerios.map(m => `${m.icon} 1g de ${m.name.charAt(0).toUpperCase() + m.name.slice(1)} <:arrow:737370913204600853> \`${m.price} ${API.money}\` ${API.moneyemoji}`).join('\n')}`)
        msg.quote(embed);

	}
};