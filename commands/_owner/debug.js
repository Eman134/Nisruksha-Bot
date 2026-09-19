module.exports = {
    requiredServices: ["debug"],
    name: 'debug',
    aliases: [],
    category: 'none',
    description: 'none',
    perm: 5,
	async execute(interaction, svcDebug) {

        await interaction.reply({ content: `Debug foi setado para ${!svcDebug}` })
        
        svcDebug = !svcDebug

	}
};