const Discord = require('../discordCompat');
const clientService = require('./clientService');

class SiteService {
    async log(id, action) {
    const client = clientService.current;
    const member = await client.users.fetch(id)

    const embed = new Discord.MessageEmbed()
    embed.setTitle('<:info:736274028515295262> Informações de ação')
    embed.setDescription(`
Usuário acionador: ${member} | ${member.tag} | ${member.id}
Ação executada: ${action}
    `).setColor('#5d7fc7')

    client.channels.cache.get('773223319603904522').send({ embeds: [embed]});
    }
}

module.exports = new SiteService();
