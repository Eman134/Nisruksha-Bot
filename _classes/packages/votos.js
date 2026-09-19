const { best, dbl } = require("../config");
const config = require('../config');
const Discord = require('../discordCompat');
const clientService = require('../services/clientService');
const economyService = require('../services/economy');
const crateService = require('../services/crateExtension');
const playersService = require('../services/players');
const UtilityService = require('../services/utilityService');
const utility = new UtilityService();

module.exports.check = async (interaction) => {

    if (config.ip != "localhost" && interaction.author.id == '782329664730824784' && interaction.channel.id == '761582265741475850') {

        try {

            if (interaction.content.includes('topgg')) {

                clientService.current.users.fetch(interaction.content.split(':')[0]).then((user) => {
    
                    let size = 1

                    const embed = new Discord.MessageEmbed()
                        .setColor('RANDOM')
                        .setDescription(`\`${user.tag}\` votou no **Top.gg** e ganhou ${size} ${utility.money2} ${utility.money2emoji} como recompensa!\nVote você também usando \`/votar\` ou [clicando aqui](https://top.gg/bot/763815343507505183)`)
                        .setAuthor(user.tag + ' | ' + user.id, user.displayAvatarURL(), 'https://top.gg/bot/763815343507505183')

                    clientService.current.channels.cache.get(dbl.voteLogs_channel).send({ embeds: [embed]});
                    economyService.addToHistory(user.id, `Vote | + ${utility.format(size)} ${utility.money2emoji}`)
                    economyService.points.add(user.id, size)
                    playersService.cooldown.set(user.id, "votetopgg", 43200);

                })
                return

            } else {
    
                const user = await clientService.current.users.fetch(interaction.embeds[0].footer.text.split(' ')[0])
        
                if (user) {
                    let size = 1
        
                    const embed = new Discord.MessageEmbed()
                        .setColor('RANDOM')
                        .setDescription(`\`${user.tag}\` votou na **Best** e ganhou ${size}x 📦 Caixa Comum como recompensa!\nVote você também usando \`/votar\` ou [clicando aqui](https://www.bestlist.online/bots/763815343507505183)`)
                        .setAuthor(user.tag + ' | ' + user.id, user.displayAvatarURL(), 'https://www.bestlist.online/bots/763815343507505183')
        
                    clientService.current.channels.cache.get(best.voteLogs_channel).send({ embeds: [embed]});
                    crateService.give(user.id, 1, 1)
                }

            }

        } catch (err) {
            clientService.current.emit('error', err)
        }
    }
}
