module.exports = {
    name: 'votar',
    aliases: ['vote', 'upvote'],
    category: 'Outros',
    description: 'Vote para ajudar no crescimento do bot e resgate recompensas',
    mastery: 10,
	async execute(API, msg) {

        const Discord = API.Discord;

        let votedtopgg = false
        const check1 = await API.playerUtils.cooldown.check(msg.author, "votetopgg");
        if (check1) votedtopgg = true

        const https = require('https')
        const options = {
            hostname: 'bestlist.online',
            port: 443,
            path: '/api/users/voted/' + msg.author.id,
            method: 'GET',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': 'fzp39n4TBbHLlk42Pwjm.best.api.token.8DfqS1mcZBPZWoqDi4nW'
          }
        }

        let votedbest = false

        const req = https.request(options, res => {
            
            res.on('data', d => {
                d = JSON.parse(d.toString());
                votedbest = d.votedToday
                const embed = new Discord.MessageEmbed()
                .setColor('#36393f')
                .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
                .setDescription('Votando no bot você nos ajudará com o crescimento do mesmo, além de você também ser recompensado!')
                .addField( (votedbest ? '🔴' : '🟢') + ' **Best**', `🗳 [Clique aqui](https://www.bestlist.online/bots/763815343507505183)\n**Recompensas:**\n1x 📦 Caixa Comum`)
                .addField( (votedtopgg ? '🔴' : '🟢') + ' **Top.gg**', `🗳 [Clique aqui](https://top.gg/bot/763815343507505183)\n**Recompensas:**\n1x ${API.money2} ${API.money2emoji}`)
                msg.quote(embed);

            })

        })

            req.on('error', error => {
            console.error(error)
        })

        req.end()
        
	}
};