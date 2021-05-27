module.exports = {

    name: "interaction",
    execute: async (API, interaction) => {

        const client = API.client;
        const prefix = API.prefix;

        if (!interaction.isCommand()) return

        interaction.author = interaction.user

        interaction.content = `${API.prefix}${interaction.commandName} ${interaction.options?.length > 0 ? interaction.options.map(i => i.value) : ''}`.trim()

        interaction.slash = true

        const channel = client.channels.cache.get(interaction.channel.id)

        interaction.channel = channel

        let response = false

        interaction.quote = async (c, o) => {
            if (!response) {
                response = true

                const x = { ...c, ...o }

                if (Object.keys(x).includes('embed')) x.embeds = [{ ...x.embed }]

                if (Object.keys(x).includes('button') || Object.keys(x).includes('buttons')) {
                    const ie = await interaction.editReply('\u200B')
                    return ie.edit(x)
                } else {
                    return interaction.editReply(x)
                }
            } else {
                return client.channels.cache.get(interaction.channel.id).send(c, o)
            }
        }
        interaction.edit = async (c, o) => {
            if (!response) {
                response = true;
                interaction.defer(true)
                return await interaction.editReply(c, o)
            } else {
                return client.channels.cache.get(interaction.channel.id).send(c, o)
            }
        }
        interaction.delete = async function() {
			return await client.api
				.webhooks(client.user.id, interaction.token)
				.messages['@original'].delete();
		};

        client.emit("message", interaction)

        interaction.defer(true)

    }
}