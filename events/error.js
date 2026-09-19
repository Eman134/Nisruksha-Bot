const { reportError } = require('../_classes/debug');

module.exports = {

    dependencies: ["Discord","client"],
    name: "error",
    execute: async (dependencies, err) => {
        const error = reportError(err, 'discord.client_error');

        const Discord = dependencies.Discord;
        let channel = dependencies.client.channels.cache.get('920404030801444885')
        const embed = new Discord.MessageEmbed()
            .setColor('#b8312c')
            .setTitle('<:error:736274027756388353> Um erro foi encontrado')
            .setDescription(`\`\`\`js\n${error.stack.slice(0, 1000)}\n\`\`\``)

        if (channel) {
            try {
                await channel.send({ embeds: [embed]});
            } catch (sendError) {
                reportError(sendError, 'discord.error_notification');
            }
        }

    }
}
