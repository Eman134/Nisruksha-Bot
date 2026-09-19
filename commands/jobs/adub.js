const townsService = require('../../_classes/services/towns');
const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const Discord = require('discord.js');
const economyService = require('../../_classes/services/economy');
const playersService = require('../../_classes/services/players');
const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'adubar',
    aliases: ['adub'],
    category: 'none',
    description: 'Realiza a adubação de seu terreno',
    mastery: 20,
    companytype: 1,
	async execute(interaction) {
        const company = await companyService.get.currentForUser(interaction.user.id);

        let pobj = await DatabaseManager.get(interaction.user.id, 'players')
        let pobj2 = await DatabaseManager.get(interaction.user.id, 'machines')

        let allplots = pobj.plots
        let plot
        let townnum = await townsService.getTownNum(interaction.user.id);
        let townname = await townsService.getTownName(interaction.user.id);
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
            const embedtemp = await utility.sendError(interaction, `Você não possui terrenos na sua vila atual!\nPara adquirir um terreno utilize \`/terrenoatual\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (!plot.adubacao || plot.adubacao >= 100) {
            const embedtemp = await utility.sendError(interaction, `Este terreno já está com a adubação em seu ápice!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let total = ((100-plot.adubacao)*3)*pobj2.level*300

        const embed = new Discord.EmbedBuilder();
        embed.setColor('#606060');
        embed.setAuthor({ name: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })

        embed.addFields({ name: '<a:loading:736625632808796250> Aguardando confirmação', value: `
        Você deseja adubar ${((100-plot.adubacao))}% de seu terreno em **${townname}** pelo preço de \`${utility.format(total)} ${utility.money}\` ${utility.moneyemoji}?` })

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        const embedinteraction = await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])] } )

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
            reacted = true;
            collector.stop();
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.adubar.defer_update'); });
            
            embed.fields = [];

            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.addFields({ name: '❌ Adubação cancelada', value: `
                Você cancelou uma adubação de ${((100-plot.adubacao))}% em seu terreno localizado em **${townname}** pelo preço de \`${utility.format(total)} ${utility.money}\` ${utility.moneyemoji}.` })
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            pobj = await DatabaseManager.get(interaction.user.id, 'players')

            const money = await economyService.money.get(interaction.user.id);
  
            if (!(money >= total)) {
              embed.setColor('#a60000');
              embed.addFields({ name: '❌ Falha na adubação', value: `Você não possui dinheiro suficiente para realizar a adubação!\nSeu dinheiro atual: **${utility.format(money)}/${utility.format(total)} ${utility.money} ${utility.moneyemoji}**` })
              await interaction.editReply({ embeds: [embed], components: [] });
              return;
            }

            let townnum = await townsService.getTownNum(interaction.user.id);
            let plots = pobj.plots

            plots[townnum].adubacao = 100

            DatabaseManager.set(interaction.user.id, 'players', 'plots', plots)

            embed.setColor('#5bff45');
            embed.addFields({ name: '✅ Adubação realizada', value: `
            Você adubou ${((100-plot.adubacao))}% de seu terreno em **${townname}** pelo preço de \`${utility.format(total)} ${utility.money}\` ${utility.moneyemoji}.` })
            await interaction.editReply({ embeds: [embed], components: [] });

            playersService.cooldown.set(interaction.user.id, "landplot", 0);

            await economyService.money.remove(interaction.user.id, total);
            await economyService.addToHistory(interaction.user.id, `Adubação <:terreno:765944910179336202> | - ${utility.format(total)}`)

        });
        
        collector.on('end', async collected => {
            if (reacted) return
            embed.setColor('#a60000');
            embed.addFields({ name: '❌ Tempo expirado', value: `
            Você iria adubar um terreno, porém o tempo expirou!` })
            interaction.editReply({ embeds: [embed], components: [] });
        });

	}
};
