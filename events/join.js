module.exports = {

    name: "guildCreate",
    execute: async(API, guild) => {
        const client = API.client;
        const Discord = API.Discord;
        
        API.serverdb.setServerInfo(guild.id, 'lastcmd', Date.now())

        const sv = await API.serverdb.getServerInfo(guild.id);

        if (sv.status == 2) {

            guild.leave()

            const embedcmd = new API.Discord.MessageEmbed()
            .setColor('#b8312c')
            .setTimestamp()
            .setTitle(`Falha: servidor banido`)
            .setDescription(`Bot tentou entrar no servidor ${guild.name}`)
            .setFooter(guild.name + " | " + guild.id, guild.iconURL())
            .setAuthor(guild.name, guild.iconURL())
            API.client.channels.cache.get('770059589076123699').send(embedcmd);

            return;
        }
        
        let owner = await API.client.users.fetch(guild.ownerID)

        const embed = new Discord.MessageEmbed();
        embed.setDescription(`Novo servidor: ${guild.name} | ${guild.id}\nOwner: <@${owner.id}> (${owner.tag})`)\nMembros ${guild.memberCount}`)
        .setColor('#55eb34')
        client.channels.cache.get('746735962196803584').send(embed);

    }
}
