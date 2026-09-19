const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const clientService = require('../../_classes/services/clientService');
const cacheListsService = require('../../_classes/services/cacheLists');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const companyService = require('../../_classes/services/company');
const economyService = require('../../_classes/services/economy');
const prisma = require('../../_classes/prisma');

module.exports = {
    name: 'uparvara',
    aliases: ['rodupgrade', 'varaupgrade', 'rodup', 'varaup', 'uv'],
    category: 'none',
    description: 'Dê upgrade na vara de pesca para melhorar a pescaria',
    mastery: 40,
    companytype: 6,
	async execute(interaction) {
        const company = await companyService.get.currentForUser(interaction.user.id);

                
        const user_id = BigInt(interaction.user.id)
        let pobj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })
        if (pobj.rod == null) delete pobj.rod

        if (await cacheListsService.waiting.includes(interaction.user.id, 'fishing')) {
            await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Você não pode upar uma vara enquanto estiver pescando! [[VER PESCA]](${await cacheListsService.waiting.getLink(interaction.user.id, 'fishing')})`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        if (!pobj.rod) {
            await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Você precisa ter uma vara de pesca para poder dar upgrade!\nCompre uma vara de pesca utilizando \`/pegarvara\``)], flags: Discord.MessageFlags.IsComponentsV2 })
            return
        }

        let total = Math.round(1200*pobj.rod.level*2)

        const container = new ContainerBuilder().setAccentColor(0x63b8ae).addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## ${pobj.rod.icon} ${pobj.rod.name}`),
            new TextDisplayBuilder().setContent(`\`${companyService.jobs.formatStars(pobj.rod.stars)}\`\nGasto por turno: **${pobj.rod.sta} 🔸**\nProfundidade: **${pobj.rod.profundidade}m**\nPreço do upgrade: **${total} ${utility.money} ${utility.moneyemoji}**`)
        )
        let embedinteraction = (await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true})).resource.message
        embedinteraction.react('🔼')

        const filter = (reaction, user) => {
            return user.id === interaction.user.id;
        };
        
        const collector = embedinteraction.createReactionCollector({ filter, time: 30000 });
        let reacted = false;
		let upgraded = false
        collector.on('collect', async (reaction, user) => {
            if (!(['🔼'].includes(reaction.emoji.name))) return;
            reacted = true;
            collector.stop();

        let pobj2 = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })
            if (pobj2.rod == null) delete pobj2.rod

            playerobj = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })

            if (!pobj2.rod) {
                const result = new ContainerBuilder().setAccentColor(0xa60000).addTextDisplayComponents(new TextDisplayBuilder().setContent(`**❌ Falha no upgrade**\nVocê precisa ter uma vara de pesca para poder dar upgrade!\nCompre uma vara de pesca utilizando \`/pegarvara\``))
                interaction.editReply({ components: [result], flags: Discord.MessageFlags.IsComponentsV2 });
                return
            }
    

            if (pobj2.money < total) {
                const result = new ContainerBuilder().setAccentColor(0xa60000).addTextDisplayComponents(new TextDisplayBuilder().setContent(`**❌ Falha no upgrade**\nVocê não possui dinheiro o suficiente para ${pobj2.rod ? 'trocar' : 'comprar'} sua vara de pesca!\nSeu dinheiro atual: **${utility.format(pobj2.money)}/${utility.format(total)} ${utility.money} ${utility.moneyemoji}**`))
                interaction.editReply({ components: [result], flags: Discord.MessageFlags.IsComponentsV2 });
                return
            }

            let list = []

            if (pobj2.rod.stars < 5) {
                list.push(0)
            }

            if (pobj2.rod.sta > 6) {
                list.push(1)
            }
            

            if (!pobj2.rod.maxprofundidade) {
                let equipobj = await companyService.jobs.fish.rods.all();
        
                for (const r of equipobj) {
                    
                    if (pobj2.rod.level == r.level) {
                        pobj2.rod.maxprofundidade = r.maxprofundidade;
                    }
        
                }

            }
            
            if (pobj2.rod.profundidade < pobj2.rod.maxprofundidade) {
                list.push(2)
            }

            if (list.length == 0) {
                const result = new ContainerBuilder().setAccentColor(0xa60000).addTextDisplayComponents(new TextDisplayBuilder().setContent(`**❌ Falha no upgrade**\nVocê não possui mais upgrades disponíveis nessa vara de pesca!`))
                return interaction.editReply({ components: [result], flags: Discord.MessageFlags.IsComponentsV2 });
            }
			upgraded = true

            economyService.money.remove(interaction.user.id, total)
            economyService.addToHistory(interaction.user.id, `Upgrade da vara de pesca | - ${utility.format(total)} ${utility.moneyemoji}`)

            if (list.includes(0)) {

                pobj2.rod.stars += 1
                await prisma.players.update({ where: { user_id }, data: { rod: pobj2.rod } })
                const result = new ContainerBuilder().setAccentColor(0x5bff45).addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## ${pobj2.rod.icon} ${pobj2.rod.name}`),
                    new TextDisplayBuilder().setContent(`\`${companyService.jobs.formatStars(pobj2.rod.stars)}\`\nGasto por turno: **${pobj2.rod.sta} 🔸**\nProfundidade: **${pobj2.rod.profundidade}m**\nPreço do upgrade: **${total} ${utility.money} ${utility.moneyemoji}**`),
                    new TextDisplayBuilder().setContent(`**✅ Sucesso no upgrade**\nVocê gastou **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** e adicionou uma estrela ⭐ ao nível da sua vara de pesca!`)
                )
                return interaction.editReply({ components: [result], flags: Discord.MessageFlags.IsComponentsV2 });

            } if (list.includes(1)) {
                pobj2.rod.sta -= 1
                await prisma.players.update({ where: { user_id }, data: { rod: pobj2.rod } })
                const result = new ContainerBuilder().setAccentColor(0x5bff45).addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## ${pobj2.rod.icon} ${pobj2.rod.name}`),
                    new TextDisplayBuilder().setContent(`\`${companyService.jobs.formatStars(pobj2.rod.stars)}\`\nGasto por turno: **${pobj2.rod.sta} 🔸**\nProfundidade: **${pobj2.rod.profundidade}m**\nPreço do upgrade: **${total} ${utility.money} ${utility.moneyemoji}**`),
                    new TextDisplayBuilder().setContent(`**✅ Sucesso no upgrade**\nVocê gastou **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** e diminuiu o gasto de estamina 🔸 da sua vara de pesca!`)
                )
                return interaction.editReply({ components: [result], flags: Discord.MessageFlags.IsComponentsV2 });

            } if (list.includes(2)) {
                pobj2.rod.profundidade = (parseFloat(pobj2.rod.profundidade) + parseFloat("0." + utility.random(2, 5))).toFixed(1)

                if (pobj2.rod.profundidade >= pobj2.rod.maxprofundidade) pobj2.rod.profundidade = pobj2.rod.maxprofundidade

                await prisma.players.update({ where: { user_id }, data: { rod: pobj2.rod } })

                const result = new ContainerBuilder().setAccentColor(0x5bff45).addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## ${pobj2.rod.icon} ${pobj2.rod.name}`),
                    new TextDisplayBuilder().setContent(`\`${companyService.jobs.formatStars(pobj2.rod.stars)}\`\nGasto por turno: **${pobj2.rod.sta} 🔸**\nProfundidade: **${pobj2.rod.profundidade}m**\nPreço do upgrade: **${total} ${utility.money} ${utility.moneyemoji}**`),
                    new TextDisplayBuilder().setContent(`**✅ Sucesso no upgrade**\nVocê gastou **${utility.format(total)} ${utility.money} ${utility.moneyemoji}** e aumentou a profundidade alcançada pela sua vara de pesca!`)
                )
                return interaction.editReply({ components: [result], flags: Discord.MessageFlags.IsComponentsV2 })
            } else {
                const result = new ContainerBuilder().setAccentColor(0xa60000).addTextDisplayComponents(new TextDisplayBuilder().setContent(`**❌ Falha no upgrade**\nVocê não possui mais upgrades disponíveis nessa vara de pesca!`))
                return interaction.editReply({ components: [result], flags: Discord.MessageFlags.IsComponentsV2 });
            }
            
            
        });
        
        collector.on('end', async collected => {
            if (reacted || upgraded) return;
            const result = new ContainerBuilder().setAccentColor(0xa60000).addTextDisplayComponents(new TextDisplayBuilder().setContent(`**❌ Tempo expirado**\nVocê iria upar sua vara de pesca, porém o tempo expirou.`))
            interaction.editReply({ components: [result], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
        });

	}
};
