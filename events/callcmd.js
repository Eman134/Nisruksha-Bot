module.exports = {

    name: "message",
    execute: async(API, msg) => {

        const votosZuraaa = require('../_classes/packages/votosZuraaa.js');
        votosZuraaa.verificaVotos(msg, (user) => {
            
            let size = 1

            const embed = new API.Discord.MessageEmbed()
            .setColor('RANDOM')
            .setDescription(`\`${user.tag}\` votou no **1º SITE** e ganhou ${size}x 📦 Caixa Comum como recompensa!\nVote você também usando \`${API.prefix}votar\` ou [clicando aqui](https://zuraaa.com/bots/763815343507505183/)`)
            .setAuthor(user.tag + ' | ' + user.id, user.displayAvatarURL(), 'https://zuraaa.com/bots/763815343507505183/')
            
            API.client.channels.cache.get('777972678069714956').send(embed)
            API.crateExtension.give(user, 1, 1)

        });
        
        const prefix = API.prefix;
        const client = API.client;
        
        if (!msg.content.toLowerCase().startsWith(prefix) || msg.author.bot || msg.channel.type == "dm") return;
        
        const args = msg.content.slice(prefix.length).split(/ +/);
        
        const command = args.shift().toLowerCase();

        let commandfile = client.commands.get(command);

        if(commandfile) {
            
            try {
                commandfile.execute(API, msg, ...args);
            } catch (error) {
                console.error(error);
                API.sendConsoleError(error.stack)
                msg.quote('Ocorreu um erro ao executar o comando ' + command);
            }

        }

    }
}
