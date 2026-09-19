const prisma = require('../_classes/prisma');
const Discord = require('discord.js');
const clientService = require('../_classes/services/clientService');

module.exports = {

    name: "guildCreate",
    execute: async (guild) => {
        const client = clientService.current;

        const server_id = BigInt(guild.id);
        const sv = await prisma.servers.upsert({ where: { server_id }, update: { server_id }, create: { server_id } });
        
        if (sv.status == 2) {

            guild.leave()
            
            const embedcmd = new Discord.EmbedBuilder()
            .setColor('#b8312c')
            .setTimestamp()
            .setTitle(`Falha: servidor banido`)
            .setDescription(`Bot tentou entrar no servidor ${guild.name}`)
            .setFooter({ text: guild.name + " | " + guild.id, iconURL: guild.iconURL() })
            .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
            client.channels.cache.get('770059589076123699').send({ embeds: [embedcmd]});
            
            return;
        }
        
        let owner = await client.users.fetch(guild.ownerId)
        
        const embed = new Discord.EmbedBuilder();
        embed.setDescription(`Novo servidor: ${guild.name} | ${guild.id}\nOwner: <@${owner.id}> (${owner.tag})\nMembros ${guild.memberCount}`)
        .setColor('#55eb34')
        client.channels.cache.get('746735962196803584').send({ embeds: [embed]});;
        await prisma.servers.update({ where: { server_id }, data: { lastcmd: Date.now() } });

    }
}
