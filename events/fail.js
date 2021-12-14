
module.exports = {

    name: "fail",
    execute: async (API, { interaction, type, desc, sendMe }) => {
        if (!API.logs.falhas) return

        try {

            interaction.author ? interaction.user = interaction.author : null
            
            const embedfail = new API.Discord.MessageEmbed()
            .setColor('#b8312c')
            .setTimestamp()
            .setTitle(`Falha: ${type}`)
            embedfail.setDescription(`${interaction.user} tentou executar o comando \`/${interaction.commandName}\` em #${interaction.channel.name}`)
            .setFooter(interaction.guild.name + " | " + interaction.guild.id, interaction.guild.iconURL())
            .setAuthor(interaction.user.tag, interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
    
            if (!interaction.content && interaction.options.size > 0) embedfail.addField('Argumentos', `\`\`\`\n${interaction.options.map(i => i.value).join(' ').slice(0, 1000)}\`\`\``)
            
            const failObject = { embeds: [embedfail], ephemeral: true }
    
            API.client.channels.cache.get('770059589076123699').send({ embeds: [embedfail]});
    
            if (!sendMe) return
    
            if (desc) embedfail.setDescription(desc)
    
            if (interaction.replied) interaction.editReply({ embeds: [embedfail] })
            else interaction.reply(failObject)
        } catch (error) {
            API.client.emit('error', error)
            console.log(error)
        }

    }
}
