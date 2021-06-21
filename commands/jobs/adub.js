module.exports = {
    name: 'adubar',
    aliases: ['adub'],
    category: 'none',
    description: 'Realiza a adubação de seu terreno',
    mastery: 20,
    companytype: 1,
	async execute(API, msg, company) {

        let pobj = await API.getInfo(msg.author, 'players')
        let pobj2 = await API.getInfo(msg.author, 'machines')

        let allplots = pobj.plots
        let plot
        let townnum = await API.townExtension.getTownNum(msg.author);
        let townname = await API.townExtension.getTownName(msg.author);
        let contains = false
        if (pobj.plots) {
            for (let r of Object.keys(pobj.plots)) {
                r = pobj.plots[r]
                if (townnum == r.loc) {

                    let areaplant = 0;
                    if (r.plants) {
                        for (const rarea of r.plants) {
                            areaplant += rarea.area
                        }
                    }

                    r.areaplant = areaplant

                    contains = true
                    plot = r;
                }
            }
        }

        
        if (!contains) {
            const embedtemp = await API.sendError(msg, `Você não possui terrenos na sua vila atual!\nPara adquirir um terreno utilize \`${API.prefix}terrenoatual\``)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        if (!plot.adubacao || plot.adubacao >= 100) {
            const embedtemp = await API.sendError(msg, `Este terreno já está com a adubação em seu ápice!`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let total = ((100-plot.adubacao)*3)*pobj2.level*300

        const embed = new API.Discord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }))

        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja adubar ${((100-plot.adubacao))}% de seu terreno em **${townname}** pelo preço de \`${API.format(total)} ${API.money}\` ${API.moneyemoji}?`)

        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        const embedmsg = await msg.quote({ embeds: [embed], component: API.rowButton([btn0, btn1]) } )

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
                embed.addField('❌ Adubação cancelada', `
                Você cancelou uma adubação de ${((100-plot.adubacao))}% em seu terreno localizado em **${townname}** pelo preço de \`${API.format(total)} ${API.money}\` ${API.moneyemoji}.`)
                embedmsg.edit({ embeds: [embed] });
                return;
            }

            pobj = await API.getInfo(msg.author, 'players')

            const money = await API.eco.money.get(msg.author);
  
            if (!(money >= total)) {
              embed.setColor('#a60000');
              embed.addField('❌ Falha na adubação', `Você não possui dinheiro suficiente para realizar a adubação!\nSeu dinheiro atual: **${API.format(money)}/${API.format(total)} ${API.money} ${API.moneyemoji}**`)
              await embedmsg.edit({ embeds: [embed] });
              return;
            }

            let townnum = await API.townExtension.getTownNum(msg.author);
            let plots = pobj.plots

            plots[townnum].adubacao = 100

            API.setInfo(msg.author, 'players', 'plots', plots)

            embed.setColor('#5bff45');
            embed.addField('✅ Adubação realizada', `
            Você adubou ${((100-plot.adubacao))}% de seu terreno em **${townname}** pelo preço de \`${API.format(total)} ${API.money}\` ${API.moneyemoji}.`)
            await embedmsg.edit({ embeds: [embed] });

            API.playerUtils.cooldown.set(msg.author, "landplot", 0);

            await API.eco.money.remove(msg.author, total);
            await API.eco.addToHistory(msg.member, `Adubação <:terreno:765944910179336202> | - ${API.format(total)}`)

        });
        
        collector.on('end', async collected => {
            if (reacted) return
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria adubar um terreno, porém o tempo expirou!`)
            embedmsg.edit({ embeds: [embed] });
        });

	}
};