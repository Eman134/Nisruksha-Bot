const Database = require("../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();
const Discord = require('discord.js');
const clientService = require('../_classes/services/clientService');

module.exports = {

    name: "guildCreate",
    execute: async (guild) => {
        const client = clientService.current;

        const sv = await DatabaseManager.get(guild.id, 'servers', 'server_id');
        
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
        DatabaseManager.set(guild.id, 'servers', 'lastcmd', Date.now(), 'server_id')

    }
}
