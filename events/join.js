const prisma = require('../_classes/prisma');
const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder } = require('@discordjs/builders');
const clientService = require('../_classes/services/clientService');

module.exports = {

    name: "guildCreate",
    execute: async (guild) => {
        const client = clientService.current;

        const server_id = BigInt(guild.id);
        const sv = await prisma.servers.upsert({ where: { server_id }, update: { server_id }, create: { server_id } });
        
        if (sv.status == 2) {

            guild.leave()
            
            const embedcmd = new ContainerBuilder()
                .setAccentColor(0xb8312c)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent('## Falha: servidor banido'),
                    new TextDisplayBuilder().setContent(`-# ${guild.name}`),
                    new TextDisplayBuilder().setContent(`Bot tentou entrar no servidor ${guild.name}`),
                    new TextDisplayBuilder().setContent(`-# ${guild.name} | ${guild.id}`)
                );
            if (guild.iconURL()) embedcmd.addMediaGalleryComponents(new MediaGalleryBuilder().addItems({ media: { url: guild.iconURL() } }));
            client.channels.cache.get('770059589076123699').send({ components: [embedcmd], flags: Discord.MessageFlags.IsComponentsV2 });
            
            return;
        }
        
        let owner = await client.users.fetch(guild.ownerId)
        
        const embed = new ContainerBuilder()
            .setAccentColor(0x55eb34)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`Novo servidor: ${guild.name} | ${guild.id}\nOwner: <@${owner.id}> (${owner.tag})\nMembros ${guild.memberCount}`));
        client.channels.cache.get('746735962196803584').send({ components: [embed], flags: Discord.MessageFlags.IsComponentsV2 });
        await prisma.servers.update({ where: { server_id }, data: { lastcmd: Date.now() } });

    }
}
