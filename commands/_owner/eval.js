module.exports = {
    name: 'eval',
    aliases: ['evaluate', 'ev'],
    category: 'none',
    description: 'Executa um código em javascript',
    options: {
        name: 'expressão',
        type: 'STRING',
        description: 'Coloque uma expressão javascript para executar',
        required: true,
    },
	async execute(API, msg) {
        const Discord = API.Discord;

        const boolean = await API.checkAll(msg, 5);
        if (boolean) return;

        const { inspect } = require('util')

        const embed = new Discord.MessageEmbed().setFooter(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))
        
        const tempo = Date.now();
        const args = API.args(msg);
        const query = args.join(' ');
        const code = (lang, code) => (`\`\`\`${lang}\n${String(code).slice(0, 1000) + (code.length >= 1000 ? '...' : '')}\n\`\`\``).replace(API.token, '*').replace(API.ip, '*')

        if (args.length == 0) {
            const embed = await API.sendError(msg, 'Argumento inexistente')
            return await msg.quote(embed)
        } else {
            try {
                
                const evald = await eval(query)
                const res = typeof evald === 'string' ? evald : inspect(evald, { depth: 0 })
                embed.addField('Código', code('js', query), false)
                embed.addField('Resultado', code('js', res), false)
                

                if (!Boolean(res) || (!Boolean(evald) && evald !== 0)) embed.setColor('RED')
                else {
                embed
                    .addField('Tipo', code('css', typeof evald), true)
                    .setColor('#6cf542')
                }
            } catch (error) {
                embed
                .addField('Erro', code('js', error), true)
                .setColor('RED')
            } finally {

                const content = '**Executado em ' + (Date.now()-tempo)+" ms**"
                const msgembed = await msg.quote({ content, embed}).catch(error => {
                msg.quote(`Ocorreu um erro ao dar eval! ${error.message}`)
                })

                msgembed.react('🗑');
                    
                msgembed.awaitReactions((reaction, user) => user.id == msg.author.id && (reaction.emoji.name == '🗑'),
                            { max: 1, time: 30000 }).then(collected => {
                                    if (collected.first().emoji.name == '🗑') {
                                        msgembed.delete();
                                    }
                            }).catch(() => {
                            });
                
                
            }
        }
    }
}
