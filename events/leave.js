const Database = require("../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();
const { reportError } = require('../_classes/debug');

module.exports = {

    name: "guildDelete",
    execute: async (API, guild) => {

        if (!guild || !guild.name) return

        const client = API.client;
        const Discord = API.Discord;

        DatabaseManager.set(guild.id, 'servers', 'lastcmd', 0, 'server_id')


        let owner = { id: '0', tag: '0#0'}
        try {
            owner = await API.client.users.fetch(guild.ownerId)
        } catch (error) {
            reportError(error, 'guild_delete.owner_fetch', { guildId: guild.id });
        }

        const embed = new Discord.MessageEmbed();
        embed.setDescription(`Saiu de um servidor: ${guild.name} | ${guild.id}\nOwner: ${owner.id} (${owner.tag})`)//\n🧑🏽 ${guild.members.cache.filter(m => m.user.bot == false).size} | 🤖 ${guild.members.cache.filter(m => m.user.bot == true).size}`)
        .setColor('#eb4634')
        client.channels.cache.get('746735962196803584').send({ embeds: [embed]});;
    }
}
