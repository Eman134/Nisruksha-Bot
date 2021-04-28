module.exports = {
    name: 'funcionários',
    aliases: ['func', 'funcionarios', 'workers'],
    category: 'Empresas',
    description: 'Visualiza a lista de funcionários e atividade',
	async execute(API, msg) {

		const boolean = await API.checkAll(msg);
        if (boolean) return;

        const Discord = API.Discord;
        const client = API.client;

        if (!(await API.company.check.hasCompany(msg.author)) && !(await API.company.check.isWorker(msg.author))) {
            API.sendError(msg, `Você deve ser funcionário ou possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize \`${API.prefix}abrirempresa <setor> <nome>\`\nPesquise empresas usando \`${API.prefix}empresas\``)
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

            await msg.quote(embed);
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
                return API.sendError(msg, 'Houve um erro ao carregar a lista de funcionários! Tente novamente.')
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
        .setTitle('Score da empresa: ' + company.score + ' ⭐')
        .setThumbnail(company.logo)
        .setColor("#34fa3a")
        .setFooter((owner.id == msg.author.id ? "Para demitir um funcionário utilize " + API.prefix + "demitir <id>" + (company.funcmax < 8 ? '\nReaja com 🔼 para realizar upgrade nos funcionários máximos (Custa ' + price + ' ⭐ da empresa)' : '') : "Para sair da empresa utilize " + API.prefix + "sairempresa"), company.logo)
        embed.addField('📌 `' + owner.tag + '` [⭐ ' + (ownerobj.companyact == null ? 0 : ownerobj.companyact.score) + ']', 'ID: ' + owner.id + '\nNível: **' + ownerobj2.level + '**\n**Fundador**', false)
        for (i = 0; i < list.length; i++) {
            const func = list[i]
            embed.addField( (func.user.id == msg.author.id ? ' ⏩ '  : '') + (parseInt(i)+1) + 'º `' + func.user.tag + '` [⭐ ' + (func.companyact == null ? 0 : func.companyact.score) + ']', 'ID: ' + func.user.id + '\nNível: **' + func.level + '**\nÚltima atividade: **' + (func.companyact == null ? 'Não houve' : API.ms2(Date.now() - func.companyact.last)) + '**\nRendeu: **' + (func.companyact == null ? API.format(0) : API.format(func.companyact.rend))  + ' ' + API.money + ' ' + API.moneyemoji + '**', false)
        }

        const embedmsg = await msg.quote(embed);

        
        if (!(await API.company.check.hasCompany(msg.author))) return
        
        let res2 = await API.company.get.company(msg.author)
        
        const maxWorkers = await API.company.get.maxWorkers(res2.company_id)

        if (maxWorkers >= 8) return

        await embedmsg.react('🔼')

        const filter = (reaction, user) => {
            return user.id === msg.author.id;
        };
        
        const collector = embedmsg.createReactionCollector(filter, { time: 15000 });
        let reacted = false;
        collector.on('collect', async (reaction, user) => {
            await reaction.users.remove(user.id);
            if (!(['🔼'].includes(reaction.emoji.name))) return;
            reacted = true;
            collector.stop();
            embed.fields = [];

            if ((res2.score < price)) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha no upgrade', `A sua empresa não possui score o suficiente para realizar upgrade!\nScore: **${API.format(res2.score)}/${API.format(price)} ⭐**`)
                embedmsg.edit(embed);
                return;
            }

            API.setCompanieInfo(msg.author, company.company_id, 'score', parseFloat(company.score) - price)
            API.setCompanieInfo(msg.author, company.company_id, 'funcmax', parseFloat(company.funcmax) + 1)

            embed.setColor('#5bff45');
            embed.addField('✅ Upgrade realizado', `
            Você subiu um nível da empresa e agora tem maior capacidade de funcionários máximo.`)
            embed.setFooter('')
            embedmsg.edit(embed);

        });
        
        collector.on('end', async collected => {
            embedmsg.reactions.removeAll();
        });

	}
};