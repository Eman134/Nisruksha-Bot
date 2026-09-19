const config = require('../../_classes/config');
const prisma = require('../../_classes/prisma');
const Discord = require('discord.js');
const { TextDisplayBuilder } = require('@discordjs/builders');

module.exports = {
    name: 'pegarperm',
    aliases: ['getperm'],
    category: 'none',
    description: 'none',
	async execute(interaction) {

        if (config.owner.includes(interaction.user.id)) {
            const user_id = BigInt(interaction.user.id)
            await prisma.players.upsert({ where: { user_id }, update: { perm: 5 }, create: { user_id, perm: 5, frames: [], badges: [] } })
            await interaction.reply({ components: [new TextDisplayBuilder().setContent('SUCCESS')], flags: Discord.MessageFlags.IsComponentsV2 })
        
        } else {
            await interaction.reply({ components: [new TextDisplayBuilder().setContent('insufficient perms')], flags: Discord.MessageFlags.IsComponentsV2 })
        }
    }
}
