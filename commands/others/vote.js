const Discord = require('discord.js');
const playersService = require('../../_classes/services/players');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const { reportError } = require('../../_classes/debug');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');

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
                const container = new ContainerBuilder()
                 .setAccentColor(0x36393f)
                 .addTextDisplayComponents(new TextDisplayBuilder().setContent([
                     `**${interaction.user.tag}**`,
                     'Votando no bot você nos ajudará com o crescimento do mesmo, além de você também ser recompensado!',
                     `${votedbest ? '🔴' : '🟢'} **Best**\n🗳 [Clique aqui](https://www.bestlist.online/bots/763815343507505183)\n**Recompensas:**\n1x 📦 Caixa Comum`,
                     `${votedtopgg ? '🔴' : '🟢'} **Top.gg**\n🗳 [Clique aqui](https://top.gg/bot/763815343507505183)\n**Recompensas:**\n1x ${utility.money2} ${utility.money2emoji}`
                 ].join('\n\n')));
                interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });

            } else {

                res.on('data', d => {
                    try {
                        d = JSON.parse(d.toString());
                        votedbest = d.votedToday
                    } catch (error) {
                        reportError(error, 'command.votar.response_json', { userId: interaction.user.id });
                    }
                    const container = new ContainerBuilder()
                     .setAccentColor(0x36393f)
                     .addTextDisplayComponents(new TextDisplayBuilder().setContent([
                         `**${interaction.user.tag}**`,
                         'Votando no bot você nos ajudará com o crescimento do mesmo, além de você também ser recompensado!',
                         `${votedbest ? '🔴' : '🟢'} **Best**\n🗳 [Clique aqui](https://www.bestlist.online/bots/763815343507505183)\n**Recompensas:**\n1x 📦 Caixa Comum`,
                         `${votedtopgg ? '🔴' : '🟢'} **Top.gg**\n🗳 [Clique aqui](https://top.gg/bot/763815343507505183)\n**Recompensas:**\n1x ${utility.money2} ${utility.money2emoji}`
                     ].join('\n\n')));
                    interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });

                })

            }

        })

            req.on('error', error => {
            reportError(error, 'command.vote.request');
        })

        req.end()
        
	}
};
