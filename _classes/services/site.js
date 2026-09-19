module.exports = function createModule(dependencies) {
    const { Discord, client, db } = dependencies;
const DatabaseManager = db;
const siteExtension = {}

siteExtension.log = async function (id, action) {

    let member = await client.users.fetch(id)

    const embed = new Discord.MessageEmbed()
    embed.setTitle('<:info:736274028515295262> Informações de ação')
    embed.setDescription(`
Usuário acionador: ${member} | ${member.tag} | ${member.id}
Ação executada: ${action}
    `).setColor('#5d7fc7')

    client.channels.cache.get('773223319603904522').send({ embeds: [embed]});
}


return siteExtension;
};
