const config = require('../../_classes/config');
const prisma = require('../../_classes/prisma');

module.exports = {
    name: 'pegarperm',
    aliases: ['getperm'],
    category: 'none',
    description: 'none',
	async execute(interaction) {

        if (config.owner.includes(interaction.user.id)) {
            const user_id = BigInt(interaction.user.id)
            await prisma.players.upsert({ where: { user_id }, update: { perm: 5 }, create: { user_id, perm: 5, frames: [], badges: [] } })
            await interaction.reply({ content: 'SUCCESS' })
        
        } else {
            await interaction.reply({ content: 'insufficient perms' })
        }
    }
}
