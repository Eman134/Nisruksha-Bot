module.exports = {
    name: 'botinfo',
    aliases: ['infobot', 'boti'],
    category: 'Outros',
    description: 'Visualize meus links próprios para votar, me convidar ou meu servidor',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        
		const embed = await API.getBotInfoProperties()
		msg.quote(embed);

	}
};