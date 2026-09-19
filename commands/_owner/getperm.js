const Database = require("../../_classes/manager/DatabaseManager")
const DatabaseManager = new Database()

module.exports = {
    requiredServices: ["owner"],
    name: 'pegarperm',
    aliases: ['getperm'],
    category: 'none',
    description: 'none',
	async execute(interaction, svcOwner) {

        if (svcOwner.includes(interaction.user.id)) {
            DatabaseManager.set(interaction.user.id, 'players', 'perm', 5)
            await interaction.reply({ content: 'SUCCESS' })
        
        } else {
            await interaction.reply({ content: 'insufficient perms' })
        }
    }
}