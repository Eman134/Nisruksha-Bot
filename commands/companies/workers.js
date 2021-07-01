module.exports = {
    name: 'funcionários',
    aliases: ['func', 'funcionarios', 'workers'],
    category: 'Empresas',
    description: 'Visualiza a lista de funcionários e atividade',
    options: [],
    mastery: 20,
	async execute(API, msg) {

        const Discord = API.Discord;
        const client = API.client;

        if (!(await API.company.check.hasCompany(msg.author)) && !(await API.company.check.isWorker(msg.author))) {
            const embedtemp = await API.sendError(msg, `Você deve ser funcionário ou possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
            await msg.quote({ embeds: [embedtemp]})
            return;
        }

        let company;
        let pobj = await API.getInfo(msg.author, 'players')
        let pobj2 = await API.getInfo(msg.author, 'machines')

        if (await API.company.check.isWorker(msg.author)) {
            company = await API.company.get.companyById(pobj.company);
        } else {
            company = await API.company.get.company(msg.author);
        }

        if (company.workers == null || company.workers.length == 0) {

            let ownerobj = await API.getInfo(msg.author, 'players')
            let ownerobj2 = await API.getInfo(msg.author, 'machines')

            const embed = new Discord.MessageEmbed()
            .setThumbnail(company.logo)
            .setColor("#34fa3a")
            .setFooter(("Para demitir um funcionário utilize " + API.prefix + "demitir <id>"), company.logo)
            embed.addField('📌 `' + msg.author.tag + '` [⭐ ' + (ownerobj.companyact == null ? 0 : ownerobj.companyact.score) + ']', 'ID: ' + msg.author.id + '\nNível: **' + ownerobj2.level + '**\nÚltima atividade: **' + (ownerobj.companyact == null ? 'Não houve' : API.ms2(Date.now() - ownerobj.companyact.last)) + '**\n**Fundador**', false)

            await msg.quote({ embeds: [embed] });
            return;
        }

        let usrlist = company.workers
        let owner = await client.users.fetch(company.user_id)
        let list = []

        for (let i = 0; i < company.workers.length; i++) {
            let user = await client.users.fetch(company.workers[i])
            if (!user) {
                usrlist.splice(i, 1)
                API.setCompanieInfo(owner, company.company_id, 'workers', usrlist)
                const embedtemp = await API.sendError(msg, 'Houve um erro ao carregar a lista de funcionários! Tente novamente.')
                await msg.quote({ embeds: [embedtemp]})
                return
            }

            let { companyact } = await API.getInfo(user, 'players')
            let { level } = await API.getInfo(user, 'machines')

            // Score, ultima atividade executada, rendimento total para a empresa
            
            list.push({
                user,
                level,
                companyact
            })

        }

        list = list.sort(function(a, b) {
            let ascore = (a.companyact == null ? 0 : a.companyact.score)
            let bscore = (b.companyact == null ? 0 : b.companyact.score)
            return bscore - ascore
        })

        let ownerobj = await API.getInfo(owner, 'players')
        let ownerobj2 = await API.getInfo(owner, 'machines')

        const price = 80
        
		const embed = new Discord.MessageEmbed()
        .setTitle('Score da empresa: ' + company.score.toFixed(2) + ' ⭐')
        .setThumbnail(company.logo)
        .setColor("#34fa3a")
        .setFooter((owner.id == msg.author.id ? "Para demitir um funcionário utilize " + API.prefix + "demitir <id>" + (company.funcmax < 8 ? '\nReaja com 🔼 para realizar upgrade nos funcionários máximos (Custa ' + price + ' ⭐ da empresa)' : '') : "Para sair da empresa utilize " + API.prefix + "sairempresa"), company.logo)
        embed.addField('📌 `' + owner.tag + '` [⭐ ' + (ownerobj.companyact == null ? 0 : ownerobj.companyact.score) + ']', 'ID: ' + owner.id + '\nNível: **' + ownerobj2.level + '**\n**Fundador**', false)
        for (i = 0; i < list.length; i++) {
            const func = list[i]
            embed.addField( (func.user.id == msg.author.id ? ' ⏩ '  : '') + (parseInt(i)+1) + 'º `' + func.user.tag + '` [⭐ ' + (func.companyact == null ? 0 : func.companyact.score) + ']', 'ID: ' + func.user.id + '\nNível: **' + func.level + '**\nÚltima atividade: **' + (func.companyact == null ? 'Não houve' : API.ms2(Date.now() - func.companyact.last)) + '**\nRendeu: **' + (func.companyact == null ? API.format(0) : API.format(func.companyact.rend))  + ' ' + API.money + ' ' + API.moneyemoji + '**', false)
        }

        if (!(await API.company.check.hasCompany(msg.author))) return await msg.quote({ embeds: [embed] })
        
        const maxWorkers = await API.company.get.maxWorkers(company.company_id)

        if (maxWorkers >= 8 || company.score.toFixed(2) < price) return await msg.quote({ embeds: [embed] })

        const embedmsg = await msg.quote({ embeds: [embed], components: [ API.rowComponents([API.createButton('up', 'PRIMARY', '', '🔼')]) ] });
        
        const filter = i => i.user.id === msg.author.id;
        
        const collector = embedmsg.createMessageComponentInteractionCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {
            if (!(b.user.id === msg.author.id)) return
            reacted = true;
            collector.stop();
            embed.fields = [];

            b.deferUpdate().catch()

            if ((company.score < price)) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha no upgrade', `A sua empresa não possui score o suficiente para realizar upgrade!\nScore: **${API.format(company.score.toFixed(2))}/${API.format(price)} ⭐**`)
                embedmsg.edit({ embeds: [embed], components: [] });
                return;
            }

            API.setCompanieInfo(msg.author, company.company_id, 'score', parseFloat(company.score) - price)
            API.setCompanieInfo(msg.author, company.company_id, 'funcmax', parseFloat(company.funcmax) + 1)

            embed.setColor('#5bff45')
            .setTitle('')
            embed.addField('✅ Upgrade realizado', `
            Você gastou ${price} ⭐ da empresa subiu um nível dela, agora a empresa possui maior capacidade de funcionários máximo.`)
            embed.setFooter('')
            embedmsg.edit({ embeds: [embed], components: [] });

        });
        
        collector.on('end', async collected => {
            embedmsg.reactions.removeAll();
        });

	}
};