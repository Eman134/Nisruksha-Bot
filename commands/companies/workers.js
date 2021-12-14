const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();

module.exports = {
    name: 'funcionários',
    aliases: ['func', 'funcionarios', 'workers'],
    category: 'Empresas',
    description: 'Visualiza a lista de funcionários e atividade',
    mastery: 20,
	async execute(API, interaction) {

        const Discord = API.Discord;
        const client = API.client;

        if (!(await API.company.check.hasCompany(interaction.user.id)) && !(await API.company.check.isWorker(interaction.user.id))) {
            const embedtemp = await API.sendError(interaction, `Você deve ser funcionário ou possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize \`/abrirempresa <setor> <nome>\`\nPesquise empresas usando \`/empresas\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let company;
        let pobj = await DatabaseManager.get(interaction.user.id, 'players')
        let pobj2 = await DatabaseManager.get(interaction.user.id, 'machines')

        if (await API.company.check.isWorker(interaction.user.id)) {
            company = await API.company.get.companyById(pobj.company);
        } else {
            company = await API.company.get.companyByOwnerId(interaction.user.id);
        }

        if (company.workers == null || company.workers.length == 0) {

            let ownerobj = await DatabaseManager.get(interaction.user.id, 'players')
            let ownerobj2 = await DatabaseManager.get(interaction.user.id, 'machines')

            const embed = new Discord.MessageEmbed()
            .setThumbnail(company.logo)
            .setColor("#34fa3a")
            .setFooter(("Para demitir um funcionário utilize /demitir <id>"), company.logo)
            embed.addField('📌 `' + interaction.user.tag + '` [⭐ ' + (ownerobj.companyact == null ? 0 : ownerobj.companyact.score) + ']', 'ID: ' + interaction.user.id + '\nNível: **' + ownerobj2.level + '**\nÚltima atividade: **' + (ownerobj.companyact == null ? 'Não houve' : API.ms2(Date.now() - ownerobj.companyact.last)) + '**\n**Fundador**', false)

            await interaction.reply({ embeds: [embed] });
            return;
        }

        let usrlist = company.workers
        let owner = await client.users.fetch(company.user_id)
        let list = []

        for (let i = 0; i < company.workers.length; i++) {
            let user = await client.users.fetch(company.workers[i])
            if (!user) {
                usrlist.splice(i, 1)
                API.setCompanieInfo(owner.id, company.company_id, 'workers', usrlist)
                const embedtemp = await API.sendError(interaction, 'Houve um erro ao carregar a lista de funcionários! Tente novamente.')
                await interaction.reply({ embeds: [embedtemp]})
                return
            }

            let { companyact } = await DatabaseManager.get(user.id, 'players')
            let { level } = await DatabaseManager.get(user.id, 'machines')

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

        let ownerobj = await DatabaseManager.get(owner.id, 'players')
        let ownerobj2 = await DatabaseManager.get(owner.id, 'machines')

        const price = 60
        
		const embed = new Discord.MessageEmbed()
        .setTitle('Score da empresa: ' + company.score.toFixed(2) + ' ⭐')
        .setThumbnail(company.logo)
        .setColor("#34fa3a")
        .setFooter((owner.id == interaction.user.id ? "Para demitir um funcionário utilize /demitir <id>" + (company.funcmax < 8 ? '\nReaja com 🔼 para realizar upgrade nos funcionários máximos (Custa ' + price + ' ⭐ da empresa)' : '') : "Para sair da empresa utilize /sairempresa"), company.logo)
        embed.addField('📌 `' + owner.tag + '` [⭐ ' + (ownerobj.companyact == null ? 0 : ownerobj.companyact.score) + ']', 'ID: ' + owner.id + '\nNível: **' + ownerobj2.level + '**\n**Fundador**', false)
        for (i = 0; i < list.length; i++) {
            const func = list[i]
            embed.addField( (func.user.id == interaction.user.id ? ' ⏩ '  : '') + (parseInt(i)+1) + 'º `' + func.user.tag + '` [⭐ ' + (func.companyact == null ? 0 : func.companyact.score) + ']', 'ID: ' + func.user.id + '\nNível: **' + func.level + '**\nÚltima atividade: **' + (func.companyact == null ? 'Não houve' : API.ms2(Date.now() - func.companyact.last)) + '**\nRendeu: **' + (func.companyact == null ? API.format(0) : API.format(func.companyact.rend))  + ' ' + API.money + ' ' + API.moneyemoji + '**', false)
        }

        if (!(await API.company.check.hasCompany(interaction.user.id))) return await interaction.reply({ embeds: [embed] })
        
        const maxWorkers = await API.company.get.maxWorkers(company.company_id)

        if (maxWorkers >= 8 || company.score.toFixed(2) < price) return await interaction.reply({ embeds: [embed] })

        const embedinteraction = await interaction.reply({ embeds: [embed], components: [ API.rowComponents([API.createButton('up', 'PRIMARY', '', '🔼')]) ], fetchReply: true });
        
        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {
            if (!(b.user.id === interaction.user.id)) return
            reacted = true;
            collector.stop();
            embed.fields = [];

            if (b && !b.deferred) b.deferUpdate().then().catch(console.error);

            if ((company.score < price)) {
                embed.setColor('#a60000');
                embed.addField('❌ Falha no upgrade', `A sua empresa não possui score o suficiente para realizar upgrade!\nScore: **${API.format(company.score.toFixed(2))}/${API.format(price)} ⭐**`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            API.setCompanieInfo(interaction.user.id, company.company_id, 'score', parseFloat(company.score) - price)
            API.setCompanieInfo(interaction.user.id, company.company_id, 'funcmax', parseFloat(company.funcmax) + 1)

            embed.setColor('#5bff45')
            .setTitle('')
            embed.addField('✅ Upgrade realizado', `
            Você gastou ${price} ⭐ da empresa subiu um nível dela, agora a empresa possui maior capacidade de funcionários máximo.`)
            embed.setFooter('')
            interaction.editReply({ embeds: [embed], components: [] });

        });
        
        collector.on('end', async collected => {
        });

	}
};