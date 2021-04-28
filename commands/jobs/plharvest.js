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
            API.sendError(msg, `Você não possui plantações neste terreno!\nVisualize seu terreno utilizando \`${API.prefix}terrenoatual\``)
            return;
        }

        
        if (args.length < 1) {
            API.sendError(msg, `Você precisa digitar o número do lote para colher!\nUtilize \`${API.prefix}terrenoatual\` para visualizar seus lotes`, `colher 1\ncolher tudo`)
            return;
        }

        if (!API.isInt(args[0]) && args[0] != "tudo") {
            API.sendError(msg, `Você precisa digitar o __número__ do lote para colher!\nUtilize \`${API.prefix}terrenoatual\` para visualizar seus lotes`, `colher 1\ncolher tudo`)
            return;
        }

        if (parseInt(args[0]) < 0 || parseInt(args[0]) > plot.plants.length) {
            API.sendError(msg, `Você não possui uma plantação nesse lote!\nUtilize \`${API.prefix}terrenoatual\` para visualizar seus lotes`)
            return;
        }

        if (args[0] == "tudo" && pobj.mvp == null && pobj.perm != 5) {
            API.sendError(msg, `Você deve possuir um **MVP** para utilizar o \`${API.prefix}colher tudo\`.\nUtilize \`${API.prefix}mvp\` para mais informações de mvp`)
            return;
        }

        let selectedplant

        let allselectedplants = []

        if (args[0] == "tudo") {

            let hasplants = false

            for (i = 0; i < plot.plants.length; i++) {
                let selectedplant2 = plot.plants[i]
        
                if (selectedplant2.maxtime-(Date.now()-selectedplant2.planted) < 0) {
                    hasplants = true
                    allselectedplants.push(selectedplant2)
                }
            }
            
            if (!hasplants) {
                API.sendError(msg, `Você não possui plantações crescidas nesse terreno!\nUtilize \`${API.prefix}terrenoatual\` para visualizar seu terreno.`)
                return;
            }
            
        } else {

            selectedplant = plot.plants[parseInt(args[0])-1]

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
                API.sendError(msg, `Esta plantação ainda não está crescida!\nUtilize \`${API.prefix}terrenoatual\` para visualizar seus lotes`)
                return;
            }

        }

        if (args[0] != "tudo") {

            allplots[townnum].plants.splice([parseInt(args[0])-1], 1)
            if (allplots[townnum].plants.length == 0) {
                delete allplots[townnum].plants
            }

        } else {
            delete allplots[townnum].plants
        }

        API.setInfo(msg.author, 'players', 'plots', allplots)

        let total = 0
        
        if (args[0] != "tudo") {
            total = Math.round(selectedplant.qnt*2*selectedplant.seed.price*pobj2.level)
        } else {
            for (i = 0; i < allselectedplants.length; i++) {
                total += Math.round(allselectedplants[i].qnt*2*allselectedplants[i].seed.price*pobj2.level)
            }
        }

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
        
        let score = ((API.company.stars.gen()*2.5).toFixed(2)) 

        if (args[0] == "tudo") {
            score *= allselectedplants.length
            xp *= allselectedplants.length
        }
        
        embed.setColor('#5bff45')
        embed.setTitle((args[0] == "tudo" ? '<:mvp:758717273304465478>' : selectedplant.seed.icon) + ' Colheita realizada!')
        embed.setDescription(`Você colheu **${args[0] == "tudo" ? `tudo (${allselectedplants.map((plan) => plan.seed.icon).join('')})` : `${selectedplant.qnt}x ${selectedplant.seed.icon} ${selectedplant.seed.displayname}`}** do seu terreno com sucesso!\nValor da colheita: **${API.format(total)} ${API.money}** ${API.moneyemoji} ${company == undefined || msg.author.id == owner.id? '':`**(${company.taxa}% | ${API.format(totaltaxa)} ${API.money} ${API.moneyemoji} de taxa da empresa**`}.\n**(+${xp} XP)** **(+${score} ⭐)**`)
        await msg.quote(embed)

        API.eco.addToHistory(msg.member, `Colheita ${args[0] == "tudo" ? '' : selectedplant.seed.icon} | + ${API.format(total)} ${API.moneyemoji}`)

        API.eco.money.add(msg.author, total)

        API.playerUtils.execExp(msg, xp);

        await API.company.stars.add(msg.author, company.company_id, { score })
        
        if (company == undefined || msg.author.id == owner.id) return
        let rend = company.rend || []
        rend.unshift(totaltaxa)
        rend = rend.slice(0, 10)
        
        API.setCompanieInfo(owner, company.company_id, 'rend', rend)

        API.company.stars.add(msg.author, company.company_id, { rend: totaltaxa })
        
        API.eco.bank.add(owner, totaltaxa)

	}
};