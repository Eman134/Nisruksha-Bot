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
        
        const msg = new API.Discord.Message(client, interaction, channel);

        interaction.channel = channel

        let response = false

        interaction.quote2 = async function (c, o) {

            const { APIMessage, Message } = require("discord.js");
            const content = c
            const options = o
          
            const { data: parsed, files } = await APIMessage
              .create(this, content, options)
              .resolveData()
              .resolveFiles()
          
            let x 
            
            if (c.type == 'rich') {
                x = { embed: c, ...o }
            } else {
                x = { ...c, ...o }
            }

            x.allowedMentions = { repliedUser: false}

            if (!options) {
                if (typeof content === 'object') {
                if (content.mention) {
                    x.allowedMentions = { repliedUser: true}
                }
                }
            } else {
                if (options.mention) {
                    x.allowedMentions = { repliedUser: true}
                }
            }

            if (x.refer) x.reply = { messageReference: x.refer }
          
            return await client.channels.cache.get(interaction.channel.id).send(x)
          }

        interaction.quote = async (c, o) => {
            if (!response) {
                response = true

                const x = { ...c, ...o }

                if (c.type == 'rich') return interaction.editReply(c)

                if (Object.keys(x).includes('embed')) x.embeds = [{ ...x.embed }]

                if (Object.keys(x).includes('button') || Object.keys(x).includes('buttons')) {
                    const ie = await interaction.editReply('\u200B')
                    return ie.edit(x)
                } else {
                    return interaction.editReply(x)
                }
            } else {
                return interaction.quote2(c, o)
            }
        }

        interaction.edit = async (c, o) => {
            if (!response) {
                response = true;
                interaction.defer(true)
                return await interaction.editReply(c, o)
            } else {
                return interaction.quote2(c, o)
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