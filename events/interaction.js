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

        interaction.quote2 = async function (c, o) {

            const { APIMessage } = require("discord.js");
            const content = c
            const options = o
          
            let x 
            
            if (c.type == 'rich') {
                x = { embed: c, ...o }
            } else {
                x = { ...c, ...o }
            }

            x.allowedMentions = { users: [], repliedUser: false }

            if (!options) {
                if (typeof content === 'object') {
                    if (content.mention) {
                        x.allowedMentions = { users: [interaction.author.id], repliedUser: true }
                    }
                }
            } else {
                if (options.mention) {
                    x.allowedMentions = { users: [interaction.author.id], repliedUser: true }
                }
            }

            const message = await interaction.fetchReply();

            x.reply = { messageReference: message.id }

            console.log(x)
          
            return await client.channels.cache.get(interaction.channel.id).send(x)
          }

        interaction.quote = async (c, o) => {
            if (!response) {

                response = true

                const x = { ...c, ...o }

                x.allowedMentions = { repliedUser: false}

                if (!o) {
                    if (typeof c === 'object') {
                        if (c.mention) {
                            x.allowedMentions = { repliedUser: true}
                        }
                    }
                } else {
                    if (o.mention) {
                        x.allowedMentions = { repliedUser: true}
                    }
                }

                if (c.type == 'rich') return interaction.editReply(c)

                if (typeof c === 'string') x.content = c

                if (Object.keys(x).includes('embed')) x.embeds = [{ ...x.embed }]

                if (Object.keys(x).includes('button') || Object.keys(x).includes('buttons') || Object.keys(x).includes('component') || Object.keys(x).includes('components')) {
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

                let x 
            
                if (c.type == 'rich') {
                    x = { embed: c, ...o }
                } else {
                    x = { ...c, ...o }
                }

                x.allowedMentions = { repliedUser: false}

                if (!o) {
                    if (typeof c === 'object') {
                        if (c.mention) {
                            x.allowedMentions = { repliedUser: true}
                        }
                    }
                } else {
                    if (o.mention) {
                        x.allowedMentions = { repliedUser: true}
                    }
                }

                return await interaction.editReply(x)

            } else {
                return interaction.quote2(c, o)
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