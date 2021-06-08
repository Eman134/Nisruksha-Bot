module.exports = {
    name: 'setores',
    aliases: ['sectors'],
    category: 'Empresas',
    description: 'Visualiza os setores de empresas disponíveis',
    options: [],
    mastery: 30,
	async execute(API, msg) {

		const Discord = API.Discord;

        const embed = new Discord.MessageEmbed()
        .setTitle('👨🏽‍🌾 | Setores de Empresas')
        for (i = 0; i < Object.keys(API.company.e).length; i++) {
            const sector = API.company.e[Object.keys(API.company.e)[i]]
            const name = Object.keys(API.company.e)[i]
            if (sector.description) embed.addField(`**${sector.icon} ${name.charAt(0).toUpperCase() + name.slice(1)}**`, sector.description)
        }
        await msg.quote(embed);

	}
};