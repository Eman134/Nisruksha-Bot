module.exports = {
    requiredServices: ["Discord","client"],
    name: 'ping',
    category: 'Outros',
    description: 'Veja a latência atual do bot',
    mastery: 5,
	async execute(interaction, svcDiscord, svcClient) {
		const embed = new svcDiscord.MessageEmbed()
	    .setColor('#32a893')
        .setDescription('🏓 Latência: ' + svcClient.ws.ping + ' ms')

        await interaction.reply({ embeds: [embed] });

	}
};