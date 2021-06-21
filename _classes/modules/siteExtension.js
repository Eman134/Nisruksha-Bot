const siteExtension = {}
const API = require("../api.js");

siteExtension.log = async function (id, action) {

    let member = await API.client.users.fetch(id)

    const embed = new API.Discord.MessageEmbed()
    embed.setTitle('<:info:736274028515295262> Informações de ação')
    embed.setDescription(`
Usuário acionador: ${member} | ${member.tag} | ${member.id}
Ação executada: ${action}
    `).setColor('#5d7fc7')

    API.client.channels.cache.get('773223319603904522').send({ embeds: [embed]});
}


module.exports = siteExtension