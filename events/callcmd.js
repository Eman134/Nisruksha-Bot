module.exports = {

    name: "messageCreate",
    execute: async (API, msg) => {

        let channel
        try {
        	channel = await API.client.channels.fetch(msg.channel.id, { force: true, cache: true })
        } catch (e) {
            API.client.emit('error', e)
        }

        const votosBest = require('../_classes/packages/votosBest.js');
        votosBest.votos(msg)

        const prefix = API.prefix;
        const client = API.client;

        const mentionRegex = new RegExp(`^<@!?${client.user.id}>$`);
        if (msg.content.match(mentionRegex)) {
                const embed = new API.Discord.MessageEmbed()
                .setColor('#36393f')
                .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                .setDescription(`Olá ${msg.author}` + ', meu prefixo é `' + API.prefix + '`, caso precise de ajuda use `' + API.prefix + 'ajuda`')
                .addField('**Mais informações**', `📨 [Entre em meu servidor](https://bit.ly/svnisru)
🗳 [Vote para ajudar o bot](https://top.gg/bot/763815343507505183)
📩 [Convide-me para seu servidor](http://bit.ly/invnisru)`)
                return await msg.quote({ embeds: [embed]});
        }

        if (!msg.content.toLowerCase().startsWith(prefix) || msg.author.bot || channel.type == "dm") return;

        const args = msg.content.slice(prefix.length).split(/ +/);

        const command = args.shift().toLowerCase();

        let commandfile = client.commands.get(command) || client.commandsaliases.get(command);

        if (commandfile) {

            try {
                const boolean = await API.checkAll(msg, { perm: commandfile.perm ? commandfile.perm : 1, mastery: commandfile.mastery ? commandfile.mastery : 0, companytype: commandfile.companytype });
                if (boolean === true) return
                if (boolean && !commandfile.companytype) return;
                if (!commandfile.companytype)await commandfile.execute(API, msg, ...args);
                else await commandfile.execute(API, msg, boolean, ...args);
            } catch (error) {
                console.error(error);
                API.client.emit('error', error)
                await msg.quote({ content: 'Ocorreu um erro ao executar o comando ' + command });
            }

        }

    }
}
