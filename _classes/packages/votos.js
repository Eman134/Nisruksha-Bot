const API = require("../api");

const { best, dbl } = require("../config");

module.exports.check = async (interaction) => {

    if (API.ip != "localhost" && interaction.author.id == '782329664730824784' && interaction.channel.id == '761582265741475850') {

        try {

            if (interaction.content.includes('topgg')) {

                API.client.users.fetch(interaction.content.split(':')[0]).then((user) => {
    
                    let size = 1

                    const embed = new API.Discord.MessageEmbed()
                        .setColor('RANDOM')
                        .setDescription(`\`${user.tag}\` votou no **Top.gg** e ganhou ${size} ${API.money2} ${API.money2emoji} como recompensa!\nVote você também usando \`/votar\` ou [clicando aqui](https://top.gg/bot/763815343507505183)`)
                        .setAuthor(user.tag + ' | ' + user.id, user.displayAvatarURL(), 'https://top.gg/bot/763815343507505183')

                    API.client.channels.cache.get(dbl.voteLogs_channel).send({ embeds: [embed]});
                    API.eco.addToHistory(user.id, `Vote | + ${API.format(size)} ${API.money2emoji}`)
                    API.eco.points.add(user.id, size)
                    API.playerUtils.cooldown.set(user.id, "votetopgg", 43200);

                })
                return

            } else {
    
                const user = await API.client.users.fetch(interaction.embeds[0].footer.text.split(' ')[0])
        
                if (user) {
                    let size = 1
        
                    const embed = new API.Discord.MessageEmbed()
                        .setColor('RANDOM')
                        .setDescription(`\`${user.tag}\` votou na **Best** e ganhou ${size}x 📦 Caixa Comum como recompensa!\nVote você também usando \`/votar\` ou [clicando aqui](https://www.bestlist.online/bots/763815343507505183)`)
                        .setAuthor(user.tag + ' | ' + user.id, user.displayAvatarURL(), 'https://www.bestlist.online/bots/763815343507505183')
        
                    API.client.channels.cache.get(best.voteLogs_channel).send({ embeds: [embed]});
                    API.crateExtension.give(user.id, 1, 1)
                }

            }

        } catch (err) {
            console.log(err);
            API.client.emit('error', err)
        }
    }
}