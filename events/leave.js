module.exports = {

    name: "guildDelete",
    execute: async (API, guild) => {
        const client = API.client;
        const Discord = API.Discord;


        try {
            await API.db.pool.query(`UPDATE servers SET lastcmd = $1 WHERE server_id=${guild.id};`, [0]);
        } catch (err) {
            client.emit('error', err)
            console.log(err)
        }

        let owner = await API.client.users.fetch(guild.ownerId)

        const embed = new Discord.MessageEmbed();
        embed.setDescription(`Saiu de um servidor: ${guild.name} | ${guild.id}\nOwner: <@${owner.id}> (${owner.tag})`)//\n🧑🏽 ${guild.members.cache.filter(m => m.user.bot == false).size} | 🤖 ${guild.members.cache.filter(m => m.user.bot == true).size}`)
        .setColor('#eb4634')
        client.channels.cache.get('746735962196803584').send({ embeds: [embed]});;
    }
}
