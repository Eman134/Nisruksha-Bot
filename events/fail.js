const { reportError } = require('../_classes/debug');
const Discord = require('discord.js');
const clientService = require('../_classes/services/clientService');
const runtime = require('../_classes/services/runtime');

module.exports = {

    name: "fail",
    execute: async ({ interaction, type, desc, sendMe }) => {
        if (!runtime.logs.falhas) return

        try {

            interaction.author ? interaction.user = interaction.author : null
            
            const embedfail = new Discord.EmbedBuilder()
            .setColor('#b8312c')
            .setTimestamp()
            .setTitle(`Falha: ${type}`)
            embedfail.setDescription(`${interaction.user} tentou executar o comando \`/${interaction.commandName}\` em #${interaction.channel.name}`)
            .setFooter({ text: interaction.guild.name + " | " + interaction.guild.id, iconURL: interaction.guild.iconURL() })
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
    
            if (!interaction.content && interaction.options.size > 0) embedfail.addFields({ name: 'Argumentos', value: `\`\`\`\n${interaction.options.map(i => i.value).join(' ').slice(0, 1000)}\`\`\`` })
            
            const failObject = { embeds: [embedfail], flags: Discord.MessageFlags.Ephemeral }
    
            clientService.current.channels.cache.get('770059589076123699').send({ embeds: [embedfail]});
    
            if (!sendMe) return
    
            if (desc) embedfail.setDescription(desc)
    
            if (interaction.replied) interaction.editReply({ embeds: [embedfail] })
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
