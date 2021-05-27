module.exports = {

    name: "interaction",
    execute: async (API, interaction) => {

        const client = API.client;
        const prefix = API.prefix;

        if (!interaction.isCommand()) return

        interaction.author = interaction.user

        interaction.content = `${API.prefix}${interaction.commandName} ${interaction.options?.length > 0 ? interaction.options.map(i => i.value) : ''}`.trim()

        interaction.slash = true

        let response = false

        interaction.quote = async (c, o) => {
            if (!response) {
                response = true
                return interaction.editReply(c, o)
            } else {
                return client.channels.cache.get(interaction.channel.id).send(c, o)
            }
        }
        interaction.edit = async (c, o) => {
            if (!response) {
                response = true;
                return interaction.editReply(c, o)
            } else {
                return client.channels.cache.get(interaction.channel.id).send(c, o)
            }
        }

        client.emit("message", interaction)

        console.log(interaction)

        //await interaction.defer(true);

    }
}