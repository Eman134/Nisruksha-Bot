module.exports = {

    name: "interactionCreate",
    execute: async (API, interaction) => {

        const client = API.client;
        const prefix = API.prefix;

        if (!interaction.isCommand()) return

        interaction.author = interaction.user

        interaction.content = `${API.prefix}${interaction.commandName} ${interaction.options._hoistedOptions.length > 0 ? interaction.options._hoistedOptions.map(i => i.value).join(' ') : ''}`.trim()

        interaction.slash = true

        const channel = client.channels.cache.get(interaction.channel.id)

        interaction.channel = channel

        let response = false

        interaction.quote = async (x) => {

            x.allowedMentions = { repliedUser: false}

            if (x.mention) x.allowedMentions = { repliedUser: true}

            if (!response) {

                response = true
                
                //if (!interaction.deferred) await interaction.defer(true)

                return interaction.reply(x)

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