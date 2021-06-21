module.exports = {
    name: 'botinfo',
    aliases: ['infobot', 'boti', 'bi'],
    category: 'Outros',
    description: 'Visualize meus links próprios para votar, me convidar ou meu servidor',
    mastery: 5,
	async execute(API, msg) {
        
		const embed = await API.getBotInfoProperties()
		await msg.quote({ embeds: [embed]});

	}
};