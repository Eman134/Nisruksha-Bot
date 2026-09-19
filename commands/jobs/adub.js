const townsService = require('../../_classes/services/towns');
const companyService = require('../../_classes/services/company');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const economyService = require('../../_classes/services/economy');
const playersService = require('../../_classes/services/players');
const prisma = require('../../_classes/prisma');
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

        const user_id = BigInt(interaction.user.id)
        let pobj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })
        let pobj2 = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })

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
            await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Você não possui terrenos na sua vila atual!\nPara adquirir um terreno utilize \`/terrenoatual\``)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        if (!plot.adubacao || plot.adubacao >= 100) {
            await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Este terreno já está com a adubação em seu ápice!`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        let total = ((100-plot.adubacao)*3)*pobj2.level*300

        const container = new ContainerBuilder().setAccentColor(0x606060)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${interaction.user.tag}**\n<a:loading:736625632808796250> Aguardando confirmação\n
        Você deseja adubar ${((100-plot.adubacao))}% de seu terreno em **${townname}** pelo preço de \`${utility.format(total)} ${utility.money}\` ${utility.moneyemoji}?`))

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        const embedinteraction = await interaction.reply({ components: [container, new ActionRowBuilder().addComponents(btn0, btn1)], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true } )

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
            reacted = true;
            collector.stop();
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.adubar.defer_update'); });
            
            if (b.customId == 'cancel'){
                const result = new ContainerBuilder().setAccentColor(0xa60000).addTextDisplayComponents(new TextDisplayBuilder().setContent(`**❌ Adubação cancelada**\n
                Você cancelou uma adubação de ${((100-plot.adubacao))}% em seu terreno localizado em **${townname}** pelo preço de \`${utility.format(total)} ${utility.money}\` ${utility.moneyemoji}.`))
                interaction.editReply({ components: [result], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }

            pobj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })

            const money = await economyService.money.get(interaction.user.id);
  
            if (!(money >= total)) {
              const result = new ContainerBuilder().setAccentColor(0xa60000).addTextDisplayComponents(new TextDisplayBuilder().setContent(`**❌ Falha na adubação**\nVocê não possui dinheiro suficiente para realizar a adubação!\nSeu dinheiro atual: **${utility.format(money)}/${utility.format(total)} ${utility.money} ${utility.moneyemoji}**`))
              await interaction.editReply({ components: [result], flags: Discord.MessageFlags.IsComponentsV2 });
              return;
            }

            let townnum = await townsService.getTownNum(interaction.user.id);
            let plots = pobj.plots

            plots[townnum].adubacao = 100

            await prisma.players.update({ where: { user_id }, data: { plots } })

            const result = new ContainerBuilder().setAccentColor(0x5bff45).addTextDisplayComponents(new TextDisplayBuilder().setContent(`**✅ Adubação realizada**\n
            Você adubou ${((100-plot.adubacao))}% de seu terreno em **${townname}** pelo preço de \`${utility.format(total)} ${utility.money}\` ${utility.moneyemoji}.`))
            await interaction.editReply({ components: [result], flags: Discord.MessageFlags.IsComponentsV2 });

            playersService.cooldown.set(interaction.user.id, "landplot", 0);

            await economyService.money.remove(interaction.user.id, total);
            await economyService.addToHistory(interaction.user.id, `Adubação <:terreno:765944910179336202> | - ${utility.format(total)}`)

        });
        
        collector.on('end', async collected => {
            if (reacted) return
            const result = new ContainerBuilder().setAccentColor(0xa60000).addTextDisplayComponents(new TextDisplayBuilder().setContent(`**❌ Tempo expirado**\n
            Você iria adubar um terreno, porém o tempo expirou!`))
            interaction.editReply({ components: [result], flags: Discord.MessageFlags.IsComponentsV2 });
        });

	}
};
