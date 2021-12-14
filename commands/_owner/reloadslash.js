module.exports = {
    name: 'reloadslash',
    aliases: ['loadslash', 'reloadsl'],
    category: 'none',
    description: 'Dá reload nos comandos de slash',
    options: [],
	async execute(API, interaction) {

        API.client.loadSlashCommands({ force: true, id: API.id })

        interaction.reply({ content: 'Comandos de Slash foram recarregados com sucesso!' })

    }
};