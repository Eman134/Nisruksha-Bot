const Database = require("../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

module.exports = {

    name: "guildCreate",
    execute: async (API, guild) => {
        const client = API.client;
        const Discord = API.Discord;

        const sv = await DatabaseManager.get(guild.id, 'servers', 'server_id');
        
        if (sv.status == 2) {

            guild.leave()
            
            const embedcmd = new API.Discord.MessageEmbed()
            .setColor('#b8312c')
            .setTimestamp()
            .setTitle(`Falha: servidor banido`)
            .setDescription(`Bot tentou entrar no servidor ${guild.name}`)
            .setFooter(guild.name + " | " + guild.id, guild.iconURL())
            .setAuthor(guild.name, guild.iconURL())
            API.client.channels.cache.get('770059589076123699').send({ embeds: [embedcmd]});
            
            return;
        }
        
        let owner = await API.client.users.fetch(guild.ownerId)
        
        const embed = new Discord.MessageEmbed();
        embed.setDescription(`Novo servidor: ${guild.name} | ${guild.id}\nOwner: <@${owner.id}> (${owner.tag})\nMembros ${guild.memberCount}`)
        .setColor('#55eb34')
        client.channels.cache.get('746735962196803584').send({ embeds: [embed]});;
        DatabaseManager.set(guild.id, 'servers', 'lastcmd', Date.now(), 'server_id')

    }
}
