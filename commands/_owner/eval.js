module.exports = {
    name: 'eval',
    aliases: ['evaluate', 'ev'],
    category: 'none',
    description: 'Executa um código em javascript',
    options: [],
    perm: 5,
	async execute(API, msg) {
        
        const Discord = API.Discord;

        const { inspect } = require('util')

        const embed = new Discord.MessageEmbed().setFooter(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        
        const tempo = Date.now();
        const args = API.args(msg);
        const query = args.join(' ');
        const code = (lang, code) => (`\`\`\`${lang}\n${String(code).slice(0, 1000) + (code.length >= 1000 ? '...' : '')}\n\`\`\``).replace(API.token, '*').replace(API.ip, '*')

        if (args.length == 0) {
            const embed = await API.sendError(msg, 'Argumento inexistente')
            return await msg.quote({ embeds: [embed] })
        } else {
            try {
                
                const evald = await eval(query)
                const res = typeof evald === 'string' ? evald : inspect(evald, { depth: 0 })
                embed.addField('Código', code('js', query), false)
                embed.addField('Resultado', code('js', res), false)
                

                if (!Boolean(res) || (!Boolean(evald) && evald !== 0)) embed.setColor('DANGER')
                else {
                embed
                    .addField('Tipo', code('css', typeof evald), true)
                    .setColor('#6cf542')
                }
            } catch (error) {
                embed
                .addField('Erro', code('js', error), true)
                .setColor('DANGER')
            } finally {

                const content = '**Executado em ' + (Date.now()-tempo)+" ms**"
                const embedmsg = await msg.quote({ content, embeds: [embed] }).catch(error => {
                msg.quote({ content: `Ocorreu um erro ao dar eval! ${error.message}`})
                })

                embedmsg.react('🗑');
                    
                embedmsg.awaitReactions((reaction, user) => user.id == msg.author.id && (reaction.emoji.name == '🗑'),
                            { max: 1, time: 30000 }).then(collected => {
                                    if (collected.first().emoji.name == '🗑') {
                                        embedmsg.delete();
                                    }
                            }).catch(() => {
                            });
                
                
            }
        }
    }
}
