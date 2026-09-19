const runtime = require('../../_classes/services/runtime');
module.exports = {
    name: 'debug',
    aliases: [],
    category: 'none',
    description: 'none',
    perm: 5,
	async execute(interaction) {

        await interaction.reply({ content: `Debug foi setado para ${!runtime.debug}` })
        
        runtime.debug = !runtime.debug

	}
};