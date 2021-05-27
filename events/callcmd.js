module.exports = {

    name: "message",
    execute: async (API, msg) => {

        const votosBest = require('../_classes/packages/votosBest.js');
        votosBest.votos(msg)

        console.log(msg)

        const prefix = API.prefix;
        const client = API.client;

        if (!msg.content.toLowerCase().startsWith(prefix) || msg.author.bot || msg.channel.type == "dm") return;

        const args = msg.content.slice(prefix.length).split(/ +/);

        const command = args.shift().toLowerCase();

        let commandfile = client.commands.get(command);

        if (commandfile) {

            try {
                commandfile.execute(API, msg, ...args);
            } catch (error) {
                console.error(error);
                API.client.emit('error', error)
                await msg.quote('Ocorreu um erro ao executar o comando ' + command);
            }

        }

    }
}
