

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
                .addField('**Mais informações**', `📨 [Entre em meu servidor](https://discord.gg/AvpRB22)
🗳 [Vote para receber recompensas](https://zuraaa.com/bots/763815343507505183/votar)
📩 [Convide-me para seu servidor](https://discord.com/oauth2/authorize?client_id=763815343507505183&scope=bot&permissions=388160)`)
                msg.quote(embed);
            }
        }
    }
}