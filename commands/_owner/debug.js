module.exports = {
    name: 'debug',
    aliases: [],
    category: 'none',
    description: 'none',
    perm: 5,
	async execute(API, interaction) {

        await interaction.reply({ content: `Debug foi setado para ${!API.debug}` })
        
        API.debug = !API.debug

	}
};