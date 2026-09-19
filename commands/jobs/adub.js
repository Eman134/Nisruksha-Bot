const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

module.exports = {
    requiredServices: ["Discord","createButton","eco","format","money","moneyemoji","playerUtils","rowComponents","sendError","townExtension"],
    name: 'adubar',
    aliases: ['adub'],
    category: 'none',
    description: 'Realiza a adubação de seu terreno',
    mastery: 20,
    companytype: 1,
	async execute(interaction, svcDiscord, svcCreateButton, svcEco, svcFormat, svcMoney, svcMoneyemoji, svcPlayerUtils, svcRowComponents, svcSendError, svcTownExtension, company) {

        let pobj = await DatabaseManager.get(interaction.user.id, 'players')
        let pobj2 = await DatabaseManager.get(interaction.user.id, 'machines')

        let allplots = pobj.plots
        let plot
        let townnum = await svcTownExtension.getTownNum(interaction.user.id);
        let townname = await svcTownExtension.getTownName(interaction.user.id);
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
            const embedtemp = await svcSendError(interaction, `Você não possui terrenos na sua vila atual!\nPara adquirir um terreno utilize \`/terrenoatual\``)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        if (!plot.adubacao || plot.adubacao >= 100) {
            const embedtemp = await svcSendError(interaction, `Este terreno já está com a adubação em seu ápice!`)
            await interaction.reply({ embeds: [embedtemp]})
            return;
        }

        let total = ((100-plot.adubacao)*3)*pobj2.level*300

        const embed = new svcDiscord.MessageEmbed();
        embed.setColor('#606060');
        embed.setAuthor(`${interaction.user.tag}`, interaction.user.displayAvatarURL({ svcFormat: 'png', dynamic: true, size: 1024 }))

        embed.addField('<a:loading:736625632808796250> Aguardando confirmação', `
        Você deseja adubar ${((100-plot.adubacao))}% de seu terreno em **${townname}** pelo preço de \`${svcFormat(total)} ${svcMoney}\` ${svcMoneyemoji}?`)

        const btn0 = svcCreateButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = svcCreateButton('cancel', 'SECONDARY', '', '❌')

        const embedinteraction = await interaction.reply({ embeds: [embed], components: [svcRowComponents([btn0, btn1])] } )

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
                embed.addField('❌ Adubação cancelada', `
                Você cancelou uma adubação de ${((100-plot.adubacao))}% em seu terreno localizado em **${townname}** pelo preço de \`${svcFormat(total)} ${svcMoney}\` ${svcMoneyemoji}.`)
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            pobj = await DatabaseManager.get(interaction.user.id, 'players')

            const svcMoney = await svcEco.svcMoney.get(interaction.user.id);
  
            if (!(svcMoney >= total)) {
              embed.setColor('#a60000');
              embed.addField('❌ Falha na adubação', `Você não possui dinheiro suficiente para realizar a adubação!\nSeu dinheiro atual: **${svcFormat(svcMoney)}/${svcFormat(total)} ${svcMoney} ${svcMoneyemoji}**`)
              await interaction.editReply({ embeds: [embed], components: [] });
              return;
            }

            let townnum = await svcTownExtension.getTownNum(interaction.user.id);
            let plots = pobj.plots

            plots[townnum].adubacao = 100

            DatabaseManager.set(interaction.user.id, 'players', 'plots', plots)

            embed.setColor('#5bff45');
            embed.addField('✅ Adubação realizada', `
            Você adubou ${((100-plot.adubacao))}% de seu terreno em **${townname}** pelo preço de \`${svcFormat(total)} ${svcMoney}\` ${svcMoneyemoji}.`)
            await interaction.editReply({ embeds: [embed], components: [] });

            svcPlayerUtils.cooldown.set(interaction.user.id, "landplot", 0);

            await svcEco.svcMoney.remove(interaction.user.id, total);
            await svcEco.addToHistory(interaction.user.id, `Adubação <:terreno:765944910179336202> | - ${svcFormat(total)}`)

        });
        
        collector.on('end', async collected => {
            if (reacted) return
            embed.setColor('#a60000');
            embed.addField('❌ Tempo expirado', `
            Você iria adubar um terreno, porém o tempo expirou!`)
            interaction.editReply({ embeds: [embed], components: [] });
        });

	}
};
