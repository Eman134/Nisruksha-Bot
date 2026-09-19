const { reportError } = require('../_classes/debug');
const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const clientService = require('../_classes/services/clientService');

module.exports = {

    name: "error",
    execute: async (err) => {
        const error = reportError(err, 'discord.client_error');

        let channel = clientService.current.channels.cache.get('920404030801444885')
        const message = new ContainerBuilder()
            .setAccentColor(0xb8312c)
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## <:error:736274027756388353> Um erro foi encontrado'),
                new TextDisplayBuilder().setContent(`\`\`\`js\n${error.stack.slice(0, 1000)}\n\`\`\``)
            );

        if (channel) {
            try {
                await channel.send({ components: [message], flags: Discord.MessageFlags.IsComponentsV2 });
            } catch (sendError) {
                reportError(sendError, 'discord.error_notification');
            }
        }

    }
}
