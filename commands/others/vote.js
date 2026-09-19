const Discord = require('discord.js');
const playersService = require('../../_classes/services/players');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'votar',
    aliases: ['vote', 'upvote'],
    category: 'Outros',
    description: 'Vote para ajudar no crescimento do bot e resgate recompensas',
    mastery: 10,
	async execute(interaction) {

        
        let votedtopgg = false
        const check1 = await playersService.cooldown.check(interaction.user.id, "votetopgg");
        if (check1) votedtopgg = true

        const { best } = require("../../_classes/config");

        const https = require('https')
        const options = {
            hostname: 'bestlist.online',
            port: 443,
            path: '/api/users/voted/' + interaction.user.id,
            method: 'GET',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': best.token
          }
        }

        let votedbest = false

        const req = https.request(options, res => {

            if (res.statusCode == 204) {

                votedbest = false
                const embed = new Discord.EmbedBuilder()
                .setColor('#36393f')
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
                .setDescription('Votando no bot você nos ajudará com o crescimento do mesmo, além de você também ser recompensado!')
                .addFields({ name: (votedbest ? '🔴' : '🟢') + ' **Best**', value: `🗳 [Clique aqui](https://www.bestlist.online/bots/763815343507505183)\n**Recompensas:**\n1x 📦 Caixa Comum` })
                .addFields({ name: (votedtopgg ? '🔴' : '🟢') + ' **Top.gg**', value: `🗳 [Clique aqui](https://top.gg/bot/763815343507505183)\n**Recompensas:**\n1x ${utility.money2} ${utility.money2emoji}` })
                interaction.reply({ embeds: [embed]});

            } else {

                res.on('data', d => {
                    try {
                        d = JSON.parse(d.toString());
                        votedbest = d.votedToday
                    } catch (error) {
                        reportError(error, 'command.votar.response_json', { userId: interaction.user.id });
                    }
                    const embed = new Discord.EmbedBuilder()
                    .setColor('#36393f')
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
                    .setDescription('Votando no bot você nos ajudará com o crescimento do mesmo, além de você também ser recompensado!')
                    .addFields({ name: (votedbest ? '🔴' : '🟢') + ' **Best**', value: `🗳 [Clique aqui](https://www.bestlist.online/bots/763815343507505183)\n**Recompensas:**\n1x 📦 Caixa Comum` })
                    .addFields({ name: (votedtopgg ? '🔴' : '🟢') + ' **Top.gg**', value: `🗳 [Clique aqui](https://top.gg/bot/763815343507505183)\n**Recompensas:**\n1x ${utility.money2} ${utility.money2emoji}` })
                    interaction.reply({ embeds: [embed]});

                })

            }

        })

            req.on('error', error => {
            reportError(error, 'command.vote.request');
        })

        req.end()
        
	}
};
