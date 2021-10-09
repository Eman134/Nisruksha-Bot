module.exports = {

    name: "error",
    execute: async (API, err) => {

        const Discord = API.Discord;
        let channel = API.client.channels.cache.get('896477669913403403')
        const embed = new Discord.MessageEmbed()
            .setColor('#b8312c')
            .setTitle('<:error:736274027756388353> Um erro foi encontrado')
            .setDescription(`\`\`\`js\n${err.stack ? err.stack.slice(0, 1000) : err}\`\`\``)

        if (channel) {
            try {
                await channel.send({ embeds: [embed]}).catch();
            } catch {
                
            }
        }

    }
}
