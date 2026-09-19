const { reportError } = require('../_classes/debug');
const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const clientService = require('../_classes/services/clientService');
const runtime = require('../_classes/services/runtime');

module.exports = {

    name: "fail",
    execute: async ({ interaction, type, desc, sendMe }) => {
        if (!runtime.logs.falhas) return

        try {

            interaction.author ? interaction.user = interaction.author : null
            
            const failTexts = [
                new TextDisplayBuilder().setContent(`## Falha: ${type}`),
                new TextDisplayBuilder().setContent(`-# ${interaction.user.tag}`),
                new TextDisplayBuilder().setContent(desc || `${interaction.user} tentou executar o comando \`/${interaction.commandName}\` em #${interaction.channel.name}`)
            ];

            if (!interaction.content && interaction.options.size > 0) {
                failTexts.push(new TextDisplayBuilder().setContent(`**Argumentos**\n\`\`\`\n${interaction.options.map(i => i.value).join(' ').slice(0, 1000)}\n\`\`\``));
            }

            failTexts.push(new TextDisplayBuilder().setContent(`-# ${interaction.guild.name} | ${interaction.guild.id}`));
            const failMessage = new ContainerBuilder()
                .setAccentColor(0xb8312c)
                .addTextDisplayComponents(...failTexts);
            const failObject = { components: [failMessage], flags: Discord.MessageFlags.Ephemeral | Discord.MessageFlags.IsComponentsV2 };

            clientService.current.channels.cache.get('770059589076123699').send({ components: [failMessage], flags: Discord.MessageFlags.IsComponentsV2 });

            if (!sendMe) return

            if (interaction.replied) interaction.editReply({ components: [failMessage], flags: Discord.MessageFlags.IsComponentsV2 })
            else interaction.reply(failObject)
        } catch (error) {
            reportError(error, 'discord.fail_event', {
                type,
                userId: interaction?.user?.id,
                command: interaction?.commandName
            });
        }

    }
}
