module.exports = {
    name: 'colher',
    aliases: ['harvest', 'colh'],
    category: 'Trabalhos',
    description: '<:icon1:745663998854430731> Faça a colheita dos seus lotes',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;
        const args = API.args(msg)

        if (!(await API.company.check.hasCompany(msg.author)) && !(await API.company.check.isWorker(msg.author))) {
            API.sendError(msg, `Você deve ser funcionário ou possuir uma empresa de agricultura para realizar esta ação!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
            return;
        }
        let company;
        let pobj = await API.getInfo(msg.author, 'players')
        let pobj2 = await API.getInfo(msg.author, 'machines')
        if (await API.company.check.isWorker(msg.author)) {
            company = await API.company.get.companyById(pobj.company);
            if (company.type != 1) {
                API.sendError(msg, `A empresa onde você trabalha não é de agricultura!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
                return;
            }
        } else {
            company = await API.company.get.company(msg.author);
            if (company.type != 1) {
                API.sendError(msg, `A sua empresa não é de agricultura!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
                return;

            }
        }
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
            API.sendError(msg, `Você não possui terrenos na sua vila atual!\nPara adquirir um terreno utilize \`${API.prefix}loja terrenos\``)
            return;
        }
        
        if (!plot.plants) {
            API.sendError(msg, `Você não possui plantações neste terreno!\nVisualize seu terreno utilizando \`${API.prefix}terreno\``)
            return;
        }

        
        if (args.length < 1) {
            API.sendError(msg, `Você precisa digitar o número do lote para colher!\nUtilize \`${API.prefix}terreno\` para visualizar seus lotes`, `colher 1`)
            return;
        }

        if (!API.isInt(args[0])) {
            API.sendError(msg, `Você precisa digitar o __número__ do lote para colher!\nUtilize \`${API.prefix}terreno\` para visualizar seus lotes`, `colher 1`)
            return;
        }

        if (parseInt(args[0]) < 0 || parseInt(args[0]) > plot.plants.length) {
            API.sendError(msg, `Você não possui uma plantação nesse lote!\nUtilize \`${API.prefix}terreno\` para visualizar seus lotes`)
            return;
        }

        let selectedplant = plot.plants[parseInt(args[0])-1]

        let ob = {
            percent: 100,
            ms: 0
        }

        if (selectedplant.maxtime-(Date.now()-selectedplant.planted) < 0) {
            ob.percent = 100
        } else {
            ob.ms = selectedplant.maxtime-(Date.now()-selectedplant.planted)

            ob.percent = 100-Math.round(ob.ms*100/selectedplant.maxtime)
        }

        if (ob.percent < 100) {
            API.sendError(msg, `Esta plantação ainda não está crescida!\nUtilize \`${API.prefix}terreno\` para visualizar seus lotes`)
            return;
        }

        allplots[townnum].plants.splice([parseInt(args[0])-1], 1)
        if (allplots[townnum].plants.length == 0) {
            delete allplots[townnum].plants
        }

        API.setInfo(msg.author, 'players', 'plots', allplots)

        //API.setInfo(msg.author, 'storage', seed.name, seedstorage[seed.displayname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()]-quantidade)

        let total = Math.round(selectedplant.qnt*2*selectedplant.seed.price*pobj2.level)

        const embed = new Discord.MessageEmbed()
        
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

        let xp = API.random(5*parseInt(pobj2.level), 8*parseInt(pobj2.level));
        API.playerUtils.execExp(msg, xp);
        
        let score = (API.company.stars.gen()*1.5).toFixed(2)
        
        embed.setColor('#5bff45')
        embed.setTitle(selectedplant.seed.icon + ' Colheita realizada!')
        embed.setDescription(`Você colheu **${selectedplant.qnt}x ${selectedplant.seed.icon} ${selectedplant.seed.displayname}** do seu terreno com sucesso!\nValor da colheita: **${API.format(total)} ${API.money}** ${API.moneyemoji} ${company == undefined || msg.author.id == owner.id? '':`**(${company.taxa}% | ${API.format(totaltaxa)} ${API.money} ${API.moneyemoji} de taxa da empresa**`}.\n**(+${xp} XP)** **(+${score} ⭐)**`)
        await msg.quote(embed)

        API.eco.addToHistory(msg.member, `Colheita ${selectedplant.seed.icon} | + ${API.format(total)} ${API.moneyemoji}`)

        API.eco.money.add(msg.author, total)
        
        if (company == undefined || msg.author.id == owner.id) return
        let rend = company.rend || []
        rend.unshift(totaltaxa)
        rend = rend.slice(0, 10)

        API.setCompanieInfo(owner, company.company_id, 'rend', rend)

        API.eco.bank.add(owner, totaltaxa)

        API.company.stars.add(msg.author, company.company_id, { score, rend })

	}
};