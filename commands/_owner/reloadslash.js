module.exports = {
    requiredServices: ["client","id"],
    name: 'reloadslash',
    aliases: ['loadslash', 'reloadsl'],
    category: 'none',
    description: 'Dá reload nos comandos de slash',
    options: [],
	async execute(interaction, svcClient, svcId) {

        svcClient.loadSlashCommands({ force: true, svcId: svcId })

        interaction.reply({ content: 'Comandos de Slash foram recarregados com sucesso!' })

    }
};