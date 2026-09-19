const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const clientService = require('./clientService');

class SiteService {
    async log(id, action) {
    const client = clientService.current;
    const member = await client.users.fetch(id)

    const container = new ContainerBuilder()
        .setAccentColor(0x5d7fc7)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## <:info:736274028515295262> Informações de ação
Usuário acionador: ${member} | ${member.tag} | ${member.id}
Ação executada: ${action}
    `));

    client.channels.cache.get('773223319603904522').send({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
    }
}

module.exports = new SiteService();
