const compactTime = (value) => utility.ms(value, true);
const Discord = require('discord.js');
const clientService = require('../../_classes/services/clientService');
const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const companyInfo = require('../../_classes/services/companyInfo');
const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'funcionários',
    aliases: ['func', 'funcionarios', 'workers'],
    category: 'Empresas',
    description: 'Visualiza a lista de funcionários e atividade',
    mastery: 20,
	async execute(interaction) {

                
        if (!(await companyService.check.hasCompany(interaction.user.id)) && !(await companyService.check.isWorker(interaction.user.id))) {
            const embedtemp = await utility.sendError(interaction, `Você deve ser funcionário ou possuir uma empresa para realizar esta ação!\nPara criar sua própria empresa utilize \`/abrirempresa <setor> <nome>\`\nPesquise empresas usando \`/empresas\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let company;
        let pobj = await DatabaseManager.get(interaction.user.id, 'players')
        let pobj2 = await DatabaseManager.get(interaction.user.id, 'machines')

        if (await companyService.check.isWorker(interaction.user.id)) {
            company = await companyService.get.companyById(pobj.company);
        } else {
            company = await companyService.get.companyByOwnerId(interaction.user.id);
        }

        if (company.workers == null || company.workers.length == 0) {

            let ownerobj = await DatabaseManager.get(interaction.user.id, 'players')
            let ownerobj2 = await DatabaseManager.get(interaction.user.id, 'machines')

            const embed = new Discord.EmbedBuilder()
            .setThumbnail(company.logo)
            .setColor("#34fa3a")
            .setFooter({ text: ("Para demitir um funcionário utilize /demitir <id>"), iconURL: company.logo })
            embed.addFields({ name: '📌 `' + interaction.user.tag + '` [⭐ ' + (ownerobj.companyact == null ? 0 : ownerobj.companyact.score) + ']', value: 'ID: ' + interaction.user.id + '\nNível: **' + ownerobj2.level + '**\nÚltima atividade: **' + (ownerobj.companyact == null ? 'Não houve' : compactTime(Date.now() - ownerobj.companyact.last)) + '**\n**Fundador**', inline: false })

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
                companyInfo.set(owner.id, company.company_id, 'workers', usrlist)
                const embedtemp = await utility.sendError(interaction, 'Houve um erro ao carregar a lista de funcionários! Tente novamente.')
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
        
		const embed = new Discord.EmbedBuilder()
        .setTitle('Score da empresa: ' + company.score.toFixed(2) + ' ⭐')
        .setThumbnail(company.logo)
        .setColor("#34fa3a")
        .setFooter({ text: (owner.id == interaction.user.id ? "Para demitir um funcionário utilize /demitir <id>" + (company.funcmax < 8 ? '\nReaja com 🔼 para realizar upgrade nos funcionários máximos (Custa ' + price + ' ⭐ da empresa)' : '') : "Para sair da empresa utilize /sairempresa"), iconURL: company.logo })
        embed.addFields({ name: '📌 `' + owner.tag + '` [⭐ ' + (ownerobj.companyact == null ? 0 : ownerobj.companyact.score) + ']', value: 'ID: ' + owner.id + '\nNível: **' + ownerobj2.level + '**\n**Fundador**', inline: false })
        for (i = 0; i < list.length; i++) {
            const func = list[i]
            embed.addFields({ name: (func.user.id == interaction.user.id ? ' ⏩ '  : '') + (parseInt(i)+1) + 'º `' + func.user.tag + '` [⭐ ' + (func.companyact == null ? 0 : func.companyact.score) + ']', value: 'ID: ' + func.user.id + '\nNível: **' + func.level + '**\nÚltima atividade: **' + (func.companyact == null ? 'Não houve' : compactTime(Date.now() - func.companyact.last)) + '**\nRendeu: **' + (func.companyact == null ? utility.format(0) : utility.format(func.companyact.rend))  + ' ' + utility.money + ' ' + utility.moneyemoji + '**', inline: false })
        }

        if (!(await companyService.check.hasCompany(interaction.user.id))) return await interaction.reply({ embeds: [embed] })
        
        const maxWorkers = await companyService.get.maxWorkers(company.company_id)

        if (maxWorkers >= 8 || company.score.toFixed(2) < price) return await interaction.reply({ embeds: [embed] })

        const embedinteraction = (await interaction.reply({ embeds: [embed], components: [ utility.rowComponents([utility.createButton('up', 'PRIMARY', '', '🔼')]) ], withResponse: true })).resource.message;
        
        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {
            if (!(b.user.id === interaction.user.id)) return
            reacted = true;
            collector.stop();
            embed.fields = [];

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.func.defer_update'); });

            if ((company.score < price)) {
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Falha no upgrade', value: `A sua empresa não possui score o suficiente para realizar upgrade!\nScore: **${utility.format(company.score.toFixed(2))}/${utility.format(price)} ⭐**` })
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            companyInfo.set(interaction.user.id, company.company_id, 'score', parseFloat(company.score) - price)
            companyInfo.set(interaction.user.id, company.company_id, 'funcmax', parseFloat(company.funcmax) + 1)

            embed.setColor('#5bff45')
            .setTitle('')
            embed.addFields({ name: '✅ Upgrade realizado', value: `
            Você gastou ${price} ⭐ da empresa subiu um nível dela, agora a empresa possui maior capacidade de funcionários máximo.` })
            embed.setFooter({ text: '' })
            interaction.editReply({ embeds: [embed], components: [] });

        });
        
        collector.on('end', async collected => {
        });

	}
};
