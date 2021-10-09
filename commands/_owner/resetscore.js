module.exports = {
    name: 'resetscore',
    aliases: ['resetarscore'],
    category: 'none',
    description: 'Executa um reset do banco de dados',
    options: [],
    perm: 5,
	async execute(API, msg) {

        var args = API.args(msg);

        if (args.length < 1) {
            const embedtemp = await API.sendError(msg, "Você precisa digitar um valor de score para ser o mínimo para o reset.", `resetscore 100`);
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (!API.isInt(API.toNumber(args[0]))) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia válida de score!`, `resetscore 100`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        const scoremin = API.toNumber(args[0])

		const Discord = API.Discord;
        const embed = new Discord.MessageEmbed()
        embed.setDescription('Reaja para continuar o reset de score acima de ' + args[0])

        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowComponents([btn0, btn1])] });

        const filter = i => i.user.id === msg.author.id;
        
        const collector = embedmsg.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === msg.author.id)) return
reacted = true;
            collector.stop();
            if (b && !b.deferred) b.deferUpdate().then(console.log).catch(console.error);
            embed.fields = [];
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.setDescription('❌ Reset cancelado', `
                Você cancelou o reset de ` + args[0])
                embedmsg.edit({ embeds: [embed], components: [] });
                return;
            }

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
                    await embedmsg.edit({ embeds: [embed], components: []  });
                }
            

        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new API.Discord.MessageEmbed();
            embed.setColor('#a60000');
            embed.setDescription('❌ Tempo expirado', `Você iria resetar ${args[0]}, porém o tempo expirou.`)
            embedmsg.edit({ embeds: [embed], components: []  });
            return;
        });

	}
};