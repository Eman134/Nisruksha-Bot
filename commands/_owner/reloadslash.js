module.exports = {
    name: 'reloadslash',
    aliases: ['loadslash', 'reloadsl'],
    category: 'none',
    description: 'Dá reload nos comandos de slash',
	async execute(API, msg) {
        const boolean = await API.checkAll(msg, 5);
        if (boolean) return;

        var args = API.args(msg);

        if (args.length < 1) {
            const embedtemp = await API.sendError(msg, "Você precisa digitar um parâmetro.", `reloadslash all\n${API.prefix}reloadslash <comando>`);
            await msg.quote(embedtemp)
            return;
        }

		const Discord = API.Discord;
        const embed = new Discord.MessageEmbed()
        embed.setDescription('Reaja para continuar o reload de ' + args[0])

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
                embed.setDescription('❌ Reload cancelado', `
                Você cancelou o reload de ` + args[0])
                embedmsg.edit(embed);
                return;
            }

            if (args[0].toLowerCase() == 'all') {
            
                API.client.loadSlash(true)
    
            } else {

                const command = args[0].toLowerCase();

                let commandfile = API.client.commands.get(command);

                if (!commandfile) {
                    embed.setColor('#a60000');
                    embed.setDescription('❌ Reload cancelado', `
                    Opção ` + args[0] + ' é inexistente.')
                    embedmsg.edit(embed);
                    return;
                }

                //API.client.application?.commands.create({ name: commandfile.name, description: commandfile.category + ' | ' + commandfile.description, options }).then((cmd) => { if (log) console.log(cmd)})
                if (commandfile.category != 'none') {
                    let options = []
                    let log = true
                    if (commandfile.options) options.push(commandfile.options)
                    API.client.application?.commands.create({ name: commandfile.name, description: commandfile.category + ' | ' + commandfile.description, options }).then((cmd) => { if (log) console.log(cmd)})
                }
                embed.setColor('#32a893');
                embed.setDescription('✅ Reload aplicado', `
                Você deu reload em ` + args[0])
                embedmsg.edit(embed);
                return;
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