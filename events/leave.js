const prisma = require('../_classes/prisma');
const { reportError } = require('../_classes/debug');
const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const clientService = require('../_classes/services/clientService');

module.exports = {

    name: "guildDelete",
    execute: async (guild) => {

        if (!guild || !guild.name) return

        const client = clientService.current;

        const server_id = BigInt(guild.id);
        await prisma.servers.upsert({ where: { server_id }, update: { lastcmd: 0 }, create: { server_id, lastcmd: 0 } });


        let owner = { id: '0', tag: '0#0'}
        try {
            owner = await client.users.fetch(guild.ownerId)
        } catch (error) {
            reportError(error, 'guild_delete.owner_fetch', { guildId: guild.id });
        }

        const embed = new ContainerBuilder()
            .setAccentColor(0xeb4634)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Saiu de um servidor: ${guild.name} | ${guild.id}\nOwner: ${owner.id} (${owner.tag})`));
        client.channels.cache.get('746735962196803584').send({ components: [embed], flags: Discord.MessageFlags.IsComponentsV2 });
    }
}
