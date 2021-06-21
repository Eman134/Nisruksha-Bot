module.exports = {
    name: 'reset',
    aliases: ['resetar', 'runquery'],
    category: 'none',
    description: 'Executa um reset do banco de dados',
    options: [],
    perm: 5,
	async execute(API, msg) {

        var args = API.args(msg);

        if (args.length < 1) {
            const embedtemp = await API.sendError(msg, "Você precisa digitar um parâmetro.", `reset all\n${API.prefix}reset cooldowns`);
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

		const Discord = API.Discord;
        const embed = new Discord.MessageEmbed()
        embed.setDescription('Reaja para continuar o reset de ' + args[0])

        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowButton([btn0, btn1])] });

        const filter = i => i.user.id === msg.author.id;
        
        const collector = embedmsg.createMessageComponentInteractionCollector(filter, { time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {
            reacted = true;
            collector.stop();
            b.deferUpdate()
            embed.fields = [];
            if (b.customID == 'cancel'){
                embed.setColor('#a60000');
                embed.setDescription('❌ Reset cancelado', `
                Você cancelou o reset de ` + args[0])
                embedmsg.edit({ embeds: [embed] });
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
                    await embedmsg.edit({ embeds: [embed] });
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
                    await embedmsg.edit({ embeds: [embed] });
                }
            }

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new API.Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.setDescription('❌ Tempo expirado', `Você iria resetar ${args[0]}, porém o tempo expirou.`)
            embedmsg.edit({ embeds: [embed] });
            return;
        });

	}
};