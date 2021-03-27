module.exports = {
    name: 'reset',
    aliases: ['resetar', 'runquery'],
    category: 'none',
    description: 'Executa um reset do banco de dados',
	async execute(API, msg) {
        const boolean = await API.checkAll(msg, 5);
        if (boolean) return;

        var args = API.args(msg);

        if (args.length < 1) {
            API.sendError(msg, "Você precisa digitar um parâmetro.", `reset all\n${API.prefix}reset cooldowns`);
            return;
        }

		const Discord = API.Discord;
        const embed = new Discord.MessageEmbed()
        embed.setDescription('Reaja para continuar o reset de ' + args[0])

        const embedmsg = await msg.quote(embed);
        
        await embedmsg.react('✅')
        embedmsg.react('❌')

        const filter = (reaction, user) => {
            return user.id === msg.author.id;
        };
        
        const collector = embedmsg.createReactionCollector(filter, { time: 15000 });
        let reacted = false;
        collector.on('collect', async (reaction, user) => {
            await reaction.users.remove(user.id);
            if (!(['✅', '❌'].includes(reaction.emoji.name))) return;
            reacted = true;
            collector.stop();
            embed.fields = [];
            if (reaction.emoji.name == '❌'){
                embed.setColor('#a60000');
                embed.setDescription('❌ Reset cancelado', `
                Você cancelou o reset de ` + args[0])
                embedmsg.edit(embed);
                return;
            }

            if (args[0].toLowerCase() == 'all') {
            
                let text1 = `SELECT table_name FROM information_schema.tables WHERE table_schema='public';`;
    
                try {
    
                    const res = await API.db.pool.query(text1);
    
                    for (const r of res.rows) {
                        let text = `DELETE FROM ${r.table_name};`;
                        await API.db.pool.query(text);
                    }
    
                    embed.setDescription(`✅ Todos os dados foram resetados!`)
                    embed.setColor('#32a893');
    
                } catch (e) {
                    embed.setDescription(`❌ Houve um erro ao tentar resetar todos os dados`)
                    embed.addField('Erro', `\`\`\`js\n${e.stack}\`\`\``);
                    embed.setColor('#eb4034')
                } finally {
                    await embedmsg.edit(embed);
                }
    
            } else {
                let text1 = `DELETE FROM ${args[0].toLowerCase()};`;
    
                try {
    
                    await API.db.pool.query(text1);
    
                    embed.setDescription(`✅ Dados da tabela \`${args[0].toLowerCase()}\` foram resetados!`)
                    embed.setColor('#32a893');
    
                } catch (e) {
                    embed.setDescription(`❌ Houve um erro ao tentar resetar os dados de \`${args[0].toLowerCase()}\``)
                    embed.addField('Erro', `\`\`\`js\n${e.stack}\`\`\``);
                    embed.setColor('#eb4034')
                } finally {
                    await embedmsg.edit(embed);
                }
            }

        });
        
        collector.on('end', async collected => {
            embedmsg.reactions.removeAll();
            if (reacted) return;
            const embed = new API.Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.setDescription('❌ Tempo expirado', `Você iria resetar ${args[0]}, porém o tempo expirou.`)
            embedmsg.edit(embed);
            return;
        });

	}
};