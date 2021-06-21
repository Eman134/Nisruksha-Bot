module.exports = {
    name: 'reloadslash',
    aliases: ['loadslash', 'reloadsl'],
    category: 'none',
    description: 'Dá reload nos comandos de slash',
    options: [],
	async execute(API, msg) {

        var args = API.args(msg);

        if (args.length < 1) {
            const embedtemp = await API.sendError(msg, "Você precisa digitar um parâmetro.", `reloadslash all\n${API.prefix}reloadslash <comando>`);
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

		const Discord = API.Discord;
        const embed = new Discord.MessageEmbed()
        embed.setDescription('Reaja para continuar o reload de ' + args[0])

        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowButton([btn0, btn1])] });

        const filter = (button) => button.clicker != null && button.clicker.user != null && button.clicker.user.id == msg.author.id
        
        const collector = embedmsg.createButtonCollector(filter, { time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {
            reacted = true;
            collector.stop();
            b.defer()
            embed.fields = [];
            if (b.id == 'cancel'){
                embed.setColor('#a60000');
                embed.setDescription('❌ Reload cancelado', `
                Você cancelou o reload de ` + args[0])
                embedmsg.edit({ embeds: [embed] });
                return;
            }

            if (args[0].toLowerCase() == 'all') {
            
                API.client.loadSlash(true)

                embed.setColor('#32a893');
                embed.setDescription('✅ Reload aplicado', `
                Você deu reload em ` + args[0])
                embedmsg.edit({ embeds: [embed] });
                return
    
            } else {

                const command = args[0].toLowerCase();

                let commandfile = API.client.commands.get(command);

                if (!commandfile) {
                    embed.setColor('#a60000');
                    embed.setDescription('❌ Reload cancelado', `
                    Opção ` + args[0] + ' é inexistente.')
                    embedmsg.edit({ embeds: [embed] });
                    return;
                }

                //API.client.application?.commands.create({ name: commandfile.name, description: commandfile.category + ' | ' + commandfile.description, options }).then((cmd) => { if (log) console.log(cmd)})
                if (commandfile.category != 'none') {
                    let options = []
                    let log = true
                    if (commandfile.options) options = commandfile.options
                    try {
                        await API.client.application?.commands.create({ name: commandfile.name, description: (commandfile.category == 'none' ? '' :  ' | ') + commandfile.description, options }).then((cmd) => { if (log) console.log('reloaded slash ' + cmd.name)})
                    } catch (error) {
                        console.log(error)
                        console.log('Um erro ocorreu ao carregar o comando ' + commandfile.name)
                    }
                }
                embed.setColor('#32a893');
                embed.setDescription('✅ Reload aplicado', `
                Você deu reload em ` + args[0])
                embedmsg.edit({ embeds: [embed] });
                return;
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