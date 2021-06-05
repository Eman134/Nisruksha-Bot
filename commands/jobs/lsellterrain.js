module.exports = {
    name: 'venderterreno',
    aliases: ['sellterrain', 'venderlote', 'vendlote', 'sellplot'],
    category: 'Trabalhos',
    description: '<:icon1:745663998854430731> Faça a venda do seu terreno atual',
    options: [],
    mastery: 30,
	async execute(API, msg) {

        const Discord = API.Discord;
        const client = API.client;

        if (!(await API.company.check.hasCompany(msg.author)) && !(await API.company.check.isWorker(msg.author))) {
            const embedtemp = await API.sendError(msg, `Você deve ser funcionário ou possuir uma empresa de agricultura para realizar esta ação!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
            await msg.quote(embedtemp)
            return;
        }
        let company;
        let pobj = await API.getInfo(msg.author, 'players')
        let pobj2 = await API.getInfo(msg.author, 'machines')
        if (await API.company.check.isWorker(msg.author)) {
            company = await API.company.get.companyById(pobj.company);
            if (company.type != 1) {
                const embedtemp = await API.sendError(msg, `A empresa onde você trabalha não é de agricultura!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
                await msg.quote(embedtemp)
                return;
            }
        } else {
            company = await API.company.get.company(msg.author);
            if (company.type != 1) {
                const embedtemp = await API.sendError(msg, `A sua empresa não é de agricultura!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
                await msg.quote(embedtemp)
                return;

            }
        }

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
            await msg.quote(embedtemp)
            return;
        }

        let index = Object.keys(pobj.plots).indexOf(townnum.toString())

        let total = plot.area*10000

		const embed = new Discord.MessageEmbed().setColor(`#a4e05a`)
        .setTitle(`Venda de terreno`)
        .addField('<a:loading:736625632808796250> Aguardando confirmação', `Você deseja vender seu terreno em **${townname}**, de área \`${plot.area}m²\` por **${API.format(total)} ${API.money} ${API.moneyemoji}**?`)
        let embedmsg = await msg.quote(embed);
        embedmsg.react('✅')
        embedmsg.react('❌')
        let emojis = ['✅', '❌']

        const filter = (reaction, user) => {
            return user.id === msg.author.id && emojis.includes(reaction.emoji.name);
        };
        
        let collector = embedmsg.createReactionCollector(filter, { time: 15000 });
        let selled = false;
        API.playerUtils.cooldown.set(msg.author, "sellterrain", 20);
        collector.on('collect', async(reaction, user) => {
            selled = true;
            collector.stop();
            embed.fields = [];
            if (reaction.emoji.name == '❌'){
                embed.setColor('#a60000');
                embed.addField('❌ Venda cancelada', `
                Você cancelou a venda de um terreno em **${townname}**, de área \`${plot.area}m²\` por **${API.format(total)} ${API.money} ${API.moneyemoji}**.`)
                embedmsg.edit(embed);
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
            embedmsg.edit(embed);
            API.eco.addToHistory(msg.member, `Venda | + ${API.format(total)} ${API.moneyemoji}`)

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
            embedmsg.reactions.removeAll();
            if (selled) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria vender um terreno em **${townname}**, de área \`${plot.area}m²\` por **${API.format(total)} ${API.money} ${API.moneyemoji}**, porém o tempo expirou!`)
            embedmsg.edit(embed);
            API.playerUtils.cooldown.set(msg.author, "sellterrain", 0);
            return;
        });

	}
};