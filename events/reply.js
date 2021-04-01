

module.exports = {

    name: "message",
    execute: async(API, msg) => {
    
        const client = API.client;
        const Discord = API.Discord;
        const prefix = API.prefix;
        const args = API.args(msg)
        if (args.length == 0) {
            let as = msg.mentions.users.map(p => p.id).join("\n")
            if (as.includes(client.user.id)) {
                const embed = new Discord.MessageEmbed()
                .setColor('#36393f')
                .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                .setDescription(`Olá ${msg.author}` + ', meu prefixo é `' + API.prefix + '`, caso precise de ajuda use `' + API.prefix + 'ajuda`')
                .addField('**Mais informações**', `📨 [Entre em meu servidor](https://dsc.gg/svnisru)
🗳 [Vote para ajudar o bot](https://top.gg/bot/763815343507505183)
📩 [Convide-me para seu servidor](https://dsc.gg/nisru)`)
                msg.quote(embed);
            }
        }
    }
}