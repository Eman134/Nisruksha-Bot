module.exports = {
    name: 'venderterreno',
    aliases: ['sellterrain', 'venderlote', 'vendlote', 'sellplot'],
    category: 'none',
    description: 'Faça a venda do seu terreno atual',
    options: [],
    mastery: 30,
    companytype: 1,
	async execute(API, msg, company) {

        const Discord = API.Discord;
        const client = API.client;

        let pobj = await API.getInfo(msg.author, 'players')

        const check = await API.playerUtils.cooldown.check(msg.author, "sellterrain");
        if (check) {

            API.playerUtils.cooldown.message(msg, 'sellterrain', 'usar este comando')

            return;
        }


        let plot = {}
        let townnum = await API.townExtension.getTownNum(msg.author);
        let townname = await API.townExtension.getTownName(msg.author);
        let contains = false
        let allplots = pobj.plots
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
                    break;
                }
            }
        }

        if (!contains) {
            const embedtemp = await API.sendError(msg, `Você não possui terrenos na sua vila atual para realizar a venda!`)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let index = Object.keys(pobj.plots).indexOf(townnum.toString())

        let total = plot.area*10000

		const embed = new Discord.MessageEmbed().setColor(`#a4e05a`)
        .setTitle(`Venda de terreno`)
        .addField('<a:loading:736625632808796250> Aguardando confirmação', `Você deseja vender seu terreno em **${townname}**, de área \`${plot.area}m²\` por **${API.format(total)} ${API.money} ${API.moneyemoji}**?`)
        
        const btn0 = API.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = API.createButton('cancel', 'SECONDARY', '', '❌')

        let embedmsg = await msg.quote({ embeds: [embed], components: [API.rowComponents([btn0, btn1])] });

        const filter = i => i.user.id === msg.author.id;
        
        let collector = embedmsg.createMessageComponentInteractionCollector({ filter, time: 15000 });
        let selled = false;
        API.playerUtils.cooldown.set(msg.author, "sellterrain", 20);
        collector.on('collect', async(b) => {

            if (!(b.user.id === msg.author.id)) return

            selled = true;
            collector.stop();
            b.deferUpdate().catch()
            embed.fields = [];
            if (b.customID == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Venda cancelada', `
                Você cancelou a venda de um terreno em **${townname}**, de área \`${plot.area}m²\` por **${API.format(total)} ${API.money} ${API.moneyemoji}**.`)
                embedmsg.edit({ embeds: [embed], components: [] });
                API.playerUtils.cooldown.set(msg.author, "sellterrain", 0);
                return;
            }

            let company;
            let pobj = await API.getInfo(msg.author, 'players')
            
            if (await API.company.check.isWorker(msg.author)) {
                company = await API.company.get.companyById(pobj.company);
            } else {
                company = await API.company.get.company(msg.author);
            }
            let owner = await API.company.get.ownerById(company.company_id);

            let totaltaxa = 0
            if (company) totaltaxa = Math.round(company.taxa*total/100)

            let totalantes = total
            total = Math.round(total-totaltaxa)

            if (msg.author.id == owner.id) {
                total = totalantes
            }
            
            embed.fields = [];
            embed.setColor('#5bff45');
            embed.addField('✅ Sucesso na venda', `
            Você vendeu um terreno em **${townname}**, de área \`${plot.area}m²\` por **${API.format(total)} ${API.money} ${API.moneyemoji}** ${company == undefined || msg.author.id == owner.id? '':`**(${company.taxa}% de taxa da empresa)**`}.`)
            embedmsg.edit({ embeds: [embed], components: [] });
            API.eco.addToHistory(msg.author, `Venda | + ${API.format(total)} ${API.moneyemoji}`)

            API.eco.money.add(msg.author, total)
            API.playerUtils.cooldown.set(msg.author, "sellterrain", 0);

            delete allplots[townnum.toString()]
            API.setInfo(msg.author, 'players', 'plots', allplots)
            
            if (company == undefined || msg.author.id == owner.id) return
            let rend = company.rend || []
            rend.unshift(totaltaxa)
            rend = rend.slice(0, 10)

            API.setCompanieInfo(owner, company.company_id, 'rend', rend)

            API.eco.bank.add(owner, totaltaxa)
            
        });
        
        collector.on('end', collected => {
            if (selled) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria vender um terreno em **${townname}**, de área \`${plot.area}m²\` por **${API.format(total)} ${API.money} ${API.moneyemoji}**, porém o tempo expirou!`)
            embedmsg.edit({ embeds: [embed], components: [] });
            API.playerUtils.cooldown.set(msg.author, "sellterrain", 0);
            return;
        });

	}
};