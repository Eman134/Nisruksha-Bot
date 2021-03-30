const API = require("../api");

module.exports.votos = async (msg) => {
    
    if(msg.author.id == '782329664730824784' && msg.channel.id == '761582265741475850'){
        try {

            await API.client.users.fetch(msg.embeds[0].footer.text)

            const user = msg.client.users.cache.find(user => user.id == msg.embeds[0].footer.text);

            if(user) {
                let size = 1

                const embed = new API.Discord.MessageEmbed()
                .setColor('RANDOM')
                .setDescription(`\`${user.tag}\` votou no **Zuraaa** e ganhou ${size}x 📦 Caixa Comum como recompensa!\nVote você também usando \`${API.prefix}votar\` ou [clicando aqui](https://zuraaa.com/bots/763815343507505183/)`)
                .setAuthor(user.tag + ' | ' + user.id, user.displayAvatarURL(), 'https://zuraaa.com/bots/763815343507505183/')
                
                API.client.channels.cache.get('777972678069714956').send(embed)
                API.crateExtension.give(user, 1, 1)
            }

        }catch(err){
            console.log(err);
            client.emit('error', err)
        }
    }
}