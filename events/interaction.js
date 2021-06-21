module.exports = {

    name: "interaction",
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

        interaction.quote2 = async function (x) {

            x.allowedMentions = { users: [], repliedUser: false }
            
            if (x.mention) x.allowedMentions = { users: [interaction.author.id], repliedUser: true }

            const message = await interaction.fetchReply();

            x.reply = { messageReference: message.id }
          
            return await client.channels.cache.get(interaction.channel.id).send(x)
          }

        interaction.quote = async (x) => {
            if (!response) {

                response = true

                x.allowedMentions = { repliedUser: false}

                if (x.mention) x.allowedMentions = { repliedUser: true}

                /*if (Object.keys(x).includes('button') || Object.keys(x).includes('buttons') || Object.keys(x).includes('component') || Object.keys(x).includes('components')) {
                    const ie = await interaction.editReply('\u200B')
                    return ie.edit(x)
                } else {
                }*/
                return interaction.editReply(x)
            } else {
                return interaction.quote2(x)
            }
        }

        interaction.edit = async (x) => {
            
            if (!response) {

                response = true;
                interaction.defer(true)

                x.allowedMentions = { repliedUser: false}
                   
                if (x.mention) x.allowedMentions = { repliedUser: true}

                return await interaction.editReply(x)

            } else {
                return interaction.quote2(x)
            }
        }

        interaction.delete = async function() {
			return await client.api
				.webhooks(client.user.id, interaction.token)
				.messages['@original'].delete();
		};

        API.client.emit("message", interaction)
        interaction.defer(true)

    }
}