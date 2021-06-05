module.exports = {
    name: 'plantar',
    aliases: ['plant'],
    category: 'Trabalhos',
    description: '<:icon1:745663998854430731> Faça um lote de plantação em seu terreno',
    options: [{
        name: 'área',
        type: 'INTEGER',
        description: 'Digite o tamanho da área para realizar a plantação',
        required: false
    },
    {
        name: 'quantia-quantia',
        type: 'INTEGER',
        description: 'Digite a quantia de sementes que deseja plantar',
        required: false
    },
    {
        name: 'semente',
        type: 'STRING',
        description: 'Digite o nome da semente que deseja plantar',
        required: false
    }],
    mastery: 20,
	async execute(API, msg) {

        const Discord = API.Discord;
        const client = API.client;
        const args = API.args(msg)

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
            const embedtemp = await API.sendError(msg, `Você não possui terrenos na sua vila atual!\nPara adquirir um terreno utilize \`${API.prefix}loja terrenos\``)
            await msg.quote(embedtemp)
            return;
        }
        
        if (plot.plants && plot.plants.length == 5) {
            const embedtemp = await API.sendError(msg, `Você atingiu o máximo de lotes no seu terreno para plantação!\nVisualize seu terreno utilizando \`${API.prefix}terrenoatual\``)
            await msg.quote(embedtemp)
            return;
        }

        if (args.length < 3) {
            const embedtemp = await API.sendError(msg, `Você precisa digitar __todas__ as informações para a plantação!\nUtilize \`${API.prefix}plantar <área em m²> <quantidade> <semente>\``, `plantar 10 20 Soja`)
            await msg.quote(embedtemp)
            return;
        }

        let area = args[0]
        let quantidade = args[1]
        let semente = API.getMultipleArgs(msg, 3)

        if (!API.isInt(area) || parseInt(area) < 5) {

            const embedtemp = await API.sendError(msg, `A __área__ precisa ser um número e no mínimo 5!\nUtilize \`${API.prefix}plantar <área em m²> <quantidade> <semente>\``, `plantar 10 20 Soja`)
            await msg.quote(embedtemp)
            return;
        }

        if (!API.isInt(quantidade)) {
            const embedtemp = await API.sendError(msg, `A __quantidade__ precisa ser um número !\nUtilize \`${API.prefix}plantar <área em m²> <quantidade> <semente>\``, `plantar 10 20 Soja`)
            await msg.quote(embedtemp)
            return;
        }

        if (parseInt(quantidade) < 5) {
            const embedtemp = await API.sendError(msg, `A __quantidade__ precisa ser no __mínimo 5__!\nUtilize \`${API.prefix}plantar <área em m²> <quantidade> <semente>\``, `plantar 10 20 Soja`)
            await msg.quote(embedtemp)
            return;
        }

        if (parseInt(quantidade) > 20) {
            const embedtemp = await API.sendError(msg, `A __quantidade__ precisa ser no __máximo 20__!\nUtilize \`${API.prefix}plantar <área em m²> <quantidade> <semente>\``, `plantar 10 20 Soja`)
            await msg.quote(embedtemp)
            return;
        }

        if (area > plot.area-plot.areaplant) {
            const embedtemp = await API.sendError(msg, `Você não possui __${area}m²__ disponíveis para outra plantação no seu terreno!\nVisualize seu terreno utilizando \`${API.prefix}terrenoatual\``)
            await msg.quote(embedtemp)
            return;
        }

        area = parseInt(area)
        quantidade = parseInt(quantidade)
        semente = semente.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

        let seedobj = API.maqExtension.ores.getObj().drops.filter(i => i.type == "seed");

        let contains2 = false;

        let seed

        let seedstorage = await API.getInfo(msg.author, 'storage')
        for (const r of seedobj) {

            if (r.displayname.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') == semente) {
                seed = r
                contains2 = true
                
                if (quantidade > seedstorage[seed.displayname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()]) {
                    contains2 = false
                }

                break;
            }
        }

        if (!contains2) {
            const embedtemp = await API.sendError(msg, `Você não possui **${quantidade}x ${seed ? seed.icon + ' ' + seed.displayname : API.getMultipleArgs(msg, 3)}** na sua mochila!\nVisualize suas sementes na mochila utilizando \`${API.prefix}mochila\``)
            await msg.quote(embedtemp)
            return;
        }

        seed.qnt = quantidade
        seed.area = area

        let maxtime = API.company.jobs.agriculture.calculatePlantTime(seed)

        if (pobj.perm != null || pobj.perm == 5) maxtime = Math.round(90*maxtime/100)
        
        let lote = {
            loc: townnum,
            seed: seed,
            area: area,
            qnt: quantidade,
            adubacao: 0,
            planted: Date.now(),
            maxtime: maxtime
        }
        let plants = plot.plants || []
        plants.push(lote)

        plot.plants = plants
        
        allplots[townnum] = plot

        API.setInfo(msg.author, 'players', 'plots', allplots)
        API.setInfo(msg.author, 'storage', seed.name, seedstorage[seed.displayname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()]-quantidade)

        const embed = new Discord.MessageEmbed()

        embed.setColor('RANDOM')
        embed.setTitle(seed.icon + ' Plantação realizada!')
        embed.setDescription(`Você cercou __${area}m²__ do seu terreno e plantou **${quantidade}x ${seed.icon} ${seed.displayname}**\nPara ver as informações dos seus lotes e terreno utilize \`${API.prefix}terrenoatual\``)
        await msg.quote(embed)

	}
};