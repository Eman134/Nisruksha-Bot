const Discord = require('discord.js');
const clientService = require('../../_classes/services/clientService');
const playersService = require('../../_classes/services/players');
const townsService = require('../../_classes/services/towns');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const companyService = require('../../_classes/services/company');
const economyService = require('../../_classes/services/economy');
const companyInfo = require('../../_classes/services/companyInfo');
const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'venderterreno',
    aliases: ['sellterrain', 'venderlote', 'vendlote', 'sellplot'],
    category: 'none',
    description: 'Faça a venda do seu terreno atual',
    mastery: 30,
    companytype: 1,
	async execute(interaction) {
        const company = await companyService.get.currentForUser(interaction.user.id);

                
        let pobj = await DatabaseManager.get(interaction.user.id, 'players')

        const check = await playersService.cooldown.check(interaction.user.id, "sellterrain");
        if (check) {

            playersService.cooldown.message(interaction, 'sellterrain', 'usar este comando')

            return;
        }


        let plot = {}
        let townnum = await townsService.getTownNum(interaction.user.id);
        let townname = await townsService.getTownName(interaction.user.id);
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
            const embedtemp = await utility.sendError(interaction, `Você não possui terrenos na sua vila atual para realizar a venda!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let index = Object.keys(pobj.plots).indexOf(townnum.toString())

        let total = plot.area*10000

		const embed = new Discord.EmbedBuilder().setColor(`#a4e05a`)
        .setTitle(`Venda de terreno`)
        .addFields({ name: '<a:loading:736625632808796250> Aguardando confirmação', value: `Você deseja vender seu terreno em **${townname}**, de área \`${plot.area}m²\` por **${utility.format(total)} ${utility.money} ${utility.moneyemoji}**?` })
        
        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        let collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let selled = false;
        playersService.cooldown.set(interaction.user.id, "sellterrain", 20);
        collector.on('collect', async(b) => {

            if (!(b.user.id === interaction.user.id)) return

            selled = true;
            collector.stop();
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.venderterreno.defer_update'); });
            embed.fields = [];
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Venda cancelada', value: `
                Você cancelou a venda de um terreno em **${townname}**, de área \`${plot.area}m²\` por **${utility.format(total)} ${utility.money} ${utility.moneyemoji}**.` })
                interaction.editReply({ embeds: [embed], components: [] });
                playersService.cooldown.set(interaction.user.id, "sellterrain", 0);
                return;
            }

            let company;
            let pobj = await DatabaseManager.get(interaction.user.id, 'players')
            
            if (await companyService.check.isWorker(interaction.user.id)) {
                company = await companyService.get.companyById(pobj.company);
            } else {
                company = await companyService.get.companyByOwnerId(interaction.user.id);
            }
            let owner = await companyService.get.ownerById(company.company_id);

            let totaltaxa = 0
            if (company) totaltaxa = Math.round(company.taxa*total/100)

            let totalantes = total
            total = Math.round(total-totaltaxa)

            if (interaction.user.id == owner.id) {
                total = totalantes
            }
            
            embed.fields = [];
            embed.setColor('#5bff45');
            embed.addFields({ name: '✅ Sucesso na venda', value: `
            Você vendeu um terreno em **${townname}**, de área \`${plot.area}m²\` por **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** ${company == undefined || interaction.user.id == owner.id? '':`**(${company.taxa}% de taxa da empresa)**`}.` })
            interaction.editReply({ embeds: [embed], components: [] });
            economyService.addToHistory(interaction.user.id, `Venda | + ${utility.format(total)} ${utility.moneyemoji}`)

            economyService.money.add(interaction.user.id, total)
            playersService.cooldown.set(interaction.user.id, "sellterrain", 0);

            delete allplots[townnum.toString()]
            DatabaseManager.set(interaction.user.id, 'players', 'plots', allplots)
            
            if (company == undefined || interaction.user.id == owner.id) return
            let rend = company.rend || []
            rend.unshift(totaltaxa)
            rend = rend.slice(0, 10)

            companyInfo.set(owner.id, company.company_id, 'rend', rend)

            economyService.bank.add(owner.id, totaltaxa)
            
        });
        
        collector.on('end', collected => {
            if (selled) return
            embed.fields = [];
            embed.setColor('#a60000');
            embed.addFields({ name: '❌ Tempo expirado', value: `
            Você iria vender um terreno em **${townname}**, de área \`${plot.area}m²\` por **${utility.format(total)} ${utility.money} ${utility.moneyemoji}**, porém o tempo expirou!` })
            interaction.editReply({ embeds: [embed], components: [] });
            playersService.cooldown.set(interaction.user.id, "sellterrain", 0);
            return;
        });

	}
};
