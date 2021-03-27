module.exports = {
    name: 'terreno',
    aliases: ['landplot', 'terrain', 'lote', 'plot'],
    category: 'Trabalhos',
    description: '<:icon1:745663998854430731> Visualiza as informações da plantação e terreno',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;

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

        let plot = {}
        let townnum = await API.townExtension.getTownNum(msg.author);
        let townname = await API.townExtension.getTownName(msg.author);
        let contains = false
        if (pobj.plots && Object.keys(pobj.plots).length > 0) {
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
            API.sendError(msg, `Você não possui terrenos na sua vila atual!\nPara adquirir um terreno utilize \`${API.prefix}loja terrenos\``)
            return;
        }

		const embed = new Discord.MessageEmbed().setColor(`#a4e05a`)
        .setTitle(`<:terreno:765944910179336202> Informações do seu terreno`) // \nConservação do terreno: \`${plot.cons}%\`
        .setDescription(`Área máxima em m²: \`${plot.area}m²\`\nLotes de plantação: \`${plot.plants ? plot.plants.length : 0}/5\`\nÁrea com plantação: \`${plot.areaplant}m²\`\nLocalização: \`${townname}\``)
        if (plot.plants && plot.plants.length > 0){
            let x = 1;
            for (const r of plot.plants) {
                //let adubacao = API.getProgress(8, '<:adub:765647640238227510>', '<:energyempty:741675234796503041>', r.adubacao, 100)

                let ob = {
                    percent: 100,
                    ms: 0
                }

                if (r.maxtime-(Date.now()-r.planted) < 0) {
                    ob.percent = 100
                } else {
                    ob.ms = r.maxtime-(Date.now()-r.planted)

                    ob.percent = 100-Math.round(ob.ms*100/r.maxtime)
                }

                let crescimento = API.getProgress(12, '<:cresc:765647640594481183>', '<:energyempty:741675234796503041>', ob.percent, 100, true)
                // \nAdubação do lote: ${adubacao}
                embed.addField(`Lote ${x}: ${r.seed.icon} ${r.seed.displayname}`, `Área da plantação: ${r.area}m²\nQuantia: ${r.qnt}\nCrescimento atual: ${crescimento}\nTempo para o crescimento: ${ob.percent >= 100 ? '✅ Crescido':API.ms2(ob.ms)}`)
                x++
            }
        } else {
            embed.addField(`❌ Não possui plantações`, `Utilize \`${API.prefix}coletar\` para coletar plantas ou sementes e começar a plantar`)
        }
        msg.quote(embed);

	}
};