const { best, dbl } = require("../config");

module.exports.dependencies = ['ip', 'client', 'Discord', 'money2', 'money2emoji', 'format', 'eco', 'playerUtils', 'crateExtension'];

module.exports.check = async (dependencies, interaction) => {

    if (dependencies.ip != "localhost" && interaction.author.id == '782329664730824784' && interaction.channel.id == '761582265741475850') {

        try {

            if (interaction.content.includes('topgg')) {

                dependencies.client.users.fetch(interaction.content.split(':')[0]).then((user) => {
    
                    let size = 1

                    const embed = new dependencies.Discord.MessageEmbed()
                        .setColor('RANDOM')
                        .setDescription(`\`${user.tag}\` votou no **Top.gg** e ganhou ${size} ${dependencies.money2} ${dependencies.money2emoji} como recompensa!\nVote você também usando \`/votar\` ou [clicando aqui](https://top.gg/bot/763815343507505183)`)
                        .setAuthor(user.tag + ' | ' + user.id, user.displayAvatarURL(), 'https://top.gg/bot/763815343507505183')

                    dependencies.client.channels.cache.get(dbl.voteLogs_channel).send({ embeds: [embed]});
                    dependencies.eco.addToHistory(user.id, `Vote | + ${dependencies.format(size)} ${dependencies.money2emoji}`)
                    dependencies.eco.points.add(user.id, size)
                    dependencies.playerUtils.cooldown.set(user.id, "votetopgg", 43200);

                })
                return

            } else {
    
                const user = await dependencies.client.users.fetch(interaction.embeds[0].footer.text.split(' ')[0])
        
                if (user) {
                    let size = 1
        
                    const embed = new dependencies.Discord.MessageEmbed()
                        .setColor('RANDOM')
                        .setDescription(`\`${user.tag}\` votou na **Best** e ganhou ${size}x 📦 Caixa Comum como recompensa!\nVote você também usando \`/votar\` ou [clicando aqui](https://www.bestlist.online/bots/763815343507505183)`)
                        .setAuthor(user.tag + ' | ' + user.id, user.displayAvatarURL(), 'https://www.bestlist.online/bots/763815343507505183')
        
                    dependencies.client.channels.cache.get(best.voteLogs_channel).send({ embeds: [embed]});
                    dependencies.crateExtension.give(user.id, 1, 1)
                }

            }

        } catch (err) {
            dependencies.client.emit('error', err)
        }
    }
}
