module.exports = {

    name: "interactionCreate",
    execute: async (API, interaction) => {

        const client = API.client;
        const prefix = API.prefix;

        if (!interaction.isCommand()) return

        interaction.author = interaction.user

        interaction.content = `${API.prefix}${interaction.commandName} ${interaction.options.size > 0 ? interaction.options.map(i => i.value).join(' ') : ''}`.trim()

        interaction.slash = true

        const channel = client.channels.cache.get(interaction.channel.id)

        interaction.channel = channel

        let response = false

        interaction.quote = async (x) => {

            x.allowedMentions = { repliedUser: false}

            if (x.mention) x.allowedMentions = { repliedUser: true}

            if (!response) {

                response = true
<<<<<<< Updated upstream
                try {
                    if (!interaction.deferred) await interaction.defer(true)
                } catch {
                    
                }

                /*if (Object.keys(x).includes('button') || Object.keys(x).includes('buttons') || Object.keys(x).includes('component') || Object.keys(x).includes('components')) {
                    const ie = await interaction.editReply('\u200B')
                    return ie.edit(x)
                } else {
                }*/
                return interaction.editReply(x)
=======
                
                if (!interaction.deferred) await interaction.defer(true)

                return interaction.reply(x)

>>>>>>> Stashed changes
            } else {
                const message = await interaction.fetchReply();

                x.reply = { messageReference: message.id }
            
                return await client.channels.cache.get(interaction.channel.id).send(x)
            }
        }

        interaction.delete = async function() {
			return await client.api
				.webhooks(client.user.id, interaction.token)
				.messages['@original'].delete();
		};

        API.client.emit("messageCreate", interaction)

    }
}