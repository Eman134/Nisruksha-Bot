module.exports = {
    name: 'gendonation',
    aliases: [],
    category: 'none',
    description: 'none',
    perm: 5,
	async execute(API, msg) {

        const Discord = API.Discord;

        const args = API.args(msg)

        if (args.length == 0 || !API.isInt(API.toNumber(args[0]))) {
            const embedtemp = await API.sendError(msg, `Você precisa especificar uma quantia de dinheiro que houve na doação!`, `gendonation <dinheiros>`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }
        
		const embed = new Discord.MessageEmbed()
		.setDescription(`Deseja gerar a mensagem de doação para R$${parseFloat(args[0])}?`, ``)

        const btn0 = API.createButton('confirm', 'SECONDARY', 'Confirmar', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', 'Cancelar', '❌')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowButton([btn0, btn1])] });

        const filter = i => i.user.id === msg.author.id;
        
        const collector = embedmsg.createMessageComponentInteractionCollector(filter, { time: 15000 });

        collector.on('collect', async (b) => {

            if (!(b.user.id === msg.author.id)) return
            reacted = true;
            
            if (b.customID == 'cancel') return collector.stop();
            embed.fields = [];
            b.deferUpdate()

            const totaldonates = await API.getGlobalInfo('totaldonates')
            const donates = await API.getGlobalInfo('donates')

            await API.setGlobalInfo('totaldonates', parseFloat(totaldonates) + parseFloat(args[0]))
            await API.setGlobalInfo('donates', parseInt(donates) + 1)

            let commandfile = API.client.commands.get('mvp')
            await commandfile.execute(API, msg, ...args);

            let commandfile2 = API.client.commands.get('doar')
            await commandfile2.execute(API, msg, ...args);

            collector.stop();

        });

        collector.on('end', async (b) => {
            msg.delete()
            embedmsg.delete()
        })

	}
};