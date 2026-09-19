const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

module.exports = {
    requiredServices: ["Discord","client","company","createButton","eco","format","money","moneyemoji","playerUtils","rowComponents","sendError","setCompanieInfo","townExtension"],
    name: 'venderterreno',
    aliases: ['sellterrain', 'venderlote', 'vendlote', 'sellplot'],
    category: 'none',
    description: 'Faça a venda do seu terreno atual',
    mastery: 30,
    companytype: 1,
	async execute(interaction, svcDiscord, svcClient, svcCompany, svcCreateButton, svcEco, svcFormat, svcMoney, svcMoneyemoji, svcPlayerUtils, svcRowComponents, svcSendError, svcSetCompanieInfo, svcTownExtension, company) {
        let pobj = await DatabaseManager.get(interaction.user.id, 'players')

        const check = await svcPlayerUtils.cooldown.check(interaction.user.id, "sellterrain");
        if (check) {

            svcPlayerUtils.cooldown.message(interaction, 'sellterrain', 'usar este comando')

            return;
        }


        let plot = {}
        let townnum = await svcTownExtension.getTownNum(interaction.user.id);
        let townname = await svcTownExtension.getTownName(interaction.user.id);
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
            const embedtemp = await svcSendError(interaction, `Você não possui terrenos na sua vila atual para realizar a venda!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let index = Object.keys(pobj.plots).indexOf(townnum.toString())

        let total = plot.area*10000

		const embed = new svcDiscord.MessageEmbed().setColor(`#a4e05a`)
        .setTitle(`Venda de terreno`)
        .addField('<a:loading:736625632808796250> Aguardando confirmação', `Você deseja vender seu terreno em **${townname}**, de área \`${plot.area}m²\` por **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}**?`)
        
        const btn0 = svcCreateButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = svcCreateButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])], withResponse: true });

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let selled = false;
        svcPlayerUtils.cooldown.set(interaction.user.id, "sellterrain", 20);
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            selled = true;
            collector.stop();
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.venderterreno.defer_update'); });
            embed.fields = [];
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addField('❌ Venda cancelada', `
                Você cancelou a venda de um terreno em **${townname}**, de área \`${plot.area}m²\` por **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}**.`)
                interaction.editReply({ embeds: [embed], components: [] });
                svcPlayerUtils.cooldown.set(interaction.user.id, "sellterrain", 0);
                return;
            }

            let company;
            let pobj = await DatabaseManager.get(interaction.user.id, 'players')
            
            if (await svcCompany.check.isWorker(interaction.user.id)) {
                company = await svcCompany.get.companyById(pobj.company);
            } else {
                company = await svcCompany.get.companyByOwnerId(interaction.user.id);
            }
            let owner = await svcCompany.get.ownerById(company.company_id);

            let totaltaxa = 0
            if (company) totaltaxa = Math.round(company.taxa*total/100)

            let totalantes = total
            total = Math.round(total-totaltaxa)

            if (interaction.user.id == owner.id) {
                total = totalantes
            }
            
            embed.fields = [];
            embed.setColor('#5bff45');
            embed.addField('✅ Sucesso na venda', `
            Você vendeu um terreno em **${townname}**, de área \`${plot.area}m²\` por **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}** ${company == undefined || interaction.user.id == owner.id? '':`**(${company.taxa}% de taxa da empresa)**`}.`)
            interaction.editReply({ embeds: [embed], components: [] });
            svcEco.addToHistory(interaction.user.id, `Venda | + ${svcFormat(total)} ${svcMoneyemoji}`)

            svcEco.svcMoney.add(interaction.user.id, total)
            svcPlayerUtils.cooldown.set(interaction.user.id, "sellterrain", 0);

            delete allplots[townnum.toString()]
            DatabaseManager.set(interaction.user.id, 'players', 'plots', allplots)
            
            if (company == undefined || interaction.user.id == owner.id) return
            let rend = company.rend || []
            rend.unshift(totaltaxa)
            rend = rend.slice(0, 10)

            svcSetCompanieInfo(owner.id, company.company_id, 'rend', rend)

            svcEco.bank.add(owner.id, totaltaxa)
            
        });
        
        collector.on('end', collected => {
            if (selled) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria vender um terreno em **${townname}**, de área \`${plot.area}m²\` por **${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}**, porém o tempo expirou!`)
            interaction.editReply({ embeds: [embed], components: [] });
            svcPlayerUtils.cooldown.set(interaction.user.id, "sellterrain", 0);
            return;
        });

	}
};
