const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const cacheListsService = require('../../_classes/services/cacheLists');
const companyService = require('../../_classes/services/company');
const economyService = require('../../_classes/services/economy');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'pegarvara',
    aliases: ['getrod', 'trocarvara', 'comprarvara'],
    category: 'none',
    description: 'Compre ou troque uma vara de pesca',
    mastery: 30,
    companytype: 6,
	async execute(interaction) {
        const company = await companyService.get.currentForUser(interaction.user.id);

        
        const user_id = BigInt(interaction.user.id)
        let pobj2 = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })

        if (pobj2.level < 3) {
            await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Você não possui nível o suficiente para pegar uma vara de pesca!\nSeu nível atual: **${pobj2.level}/3**\nVeja seu progresso atual utilizando \`/perfil\``)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        if (await cacheListsService.waiting.includes(interaction.user.id, 'fishing')) {
            await interaction.reply({ components: [new TextDisplayBuilder().setContent(`Você não pode comprar/trocar uma vara enquanto estiver pescando! [[VER PESCA]](${await cacheListsService.waiting.getLink(interaction.user.id, 'fishing')})`)], flags: Discord.MessageFlags.IsComponentsV2 })
            return;
        }

        let total = 1200*(pobj2.level)
        let disp = await companyService.jobs.fish.rods.possibilities(pobj2.level)

        const container = new ContainerBuilder().setAccentColor(0x63b8ae).addTextDisplayComponents(
            new TextDisplayBuilder().setContent('## 🎣 Varas disponíveis'),
            new TextDisplayBuilder().setContent('**Explicação:** Ao confirmar a reação, o sistema irá sortear uma vara dentre as disponíveis, e a vara de pesca será essa.\n**Preço atual: ' + utility.format(total) + ' ' + utility.money + '** ' + utility.moneyemoji)
        )
        for (let i = 0; i < disp.length; i++) {
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${disp[i].icon} ${disp[i].name}**\n\`${companyService.jobs.formatStars(disp[i].stars)}\`\nGasto por turno: **${disp[i].sta} 🔸**\nProfundidade: **${disp[i].profundidade}m**\nProfundidade Máxima: **${disp[i].maxprofundidade}m**`))
        }

        function reworkBtns(hasrod) {

            const btn0 = utility.createButton(hasrod ? 'troca' : 'compra', 'SECONDARY', hasrod ? 'Trocar vara' : 'Comprar vara', hasrod ? '🔁' : '✅')
            const btn1 = utility.createButton('cancel', 'SECONDARY', 'Cancelar', '❌')

            return [new ActionRowBuilder().addComponents(btn0, btn1)]
        }

        let pobjcheck = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })
        if (pobjcheck.rod == null) delete pobjcheck.rod


        let embedinteraction = (await interaction.reply({ components: [container, ...reworkBtns(pobjcheck.rod)], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 30000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
            reacted = true;

            let troca = b.customId == 'troca'

            let pobj2 = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })
            if (pobj2.rod == null) delete pobj2.rod
            let pobj3 = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })

            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.bgetrod.defer_update'); });

            if (b.customId == 'cancel'){
                const result = new ContainerBuilder().setAccentColor(0xa60000).addTextDisplayComponents(new TextDisplayBuilder().setContent(`**❌ ${pobj2.rod ? 'Troca' : 'Compra'} cancelada**\nVocê cancelou a ${pobj2.rod ? 'troca' : 'compra'} da sua vara de pesca!.`))
                interaction.editReply({ components: [result], flags: Discord.MessageFlags.IsComponentsV2 });
				collector.stop();
                return;
            }

            playerobj = await prisma.machines.upsert({ where: { user_id }, update: { user_id }, create: { user_id, slots: [] } })

            if (pobj2.money < total) {
                const result = new ContainerBuilder().setAccentColor(0xa60000).addTextDisplayComponents(new TextDisplayBuilder().setContent(`**❌ Falha na ${pobj2.rod ? 'troca' : 'compra'}**\nVocê não possui dinheiro o suficiente para ${pobj2.rod ? 'trocar' : 'comprar'} sua vara de pesca!\nSeu dinheiro atual: **${utility.format(pobj2.money)}/${utility.format(total)} ${utility.money} ${utility.moneyemoji}**`))
                interaction.editReply({ components: [result], flags: Discord.MessageFlags.IsComponentsV2 });
				collector.stop();
                return
            }
            
            economyService.money.remove(interaction.user.id, total)
            economyService.addToHistory(interaction.user.id, `${pobj2.rod ? 'Troca' : 'Compra'} de vara de pesca | - ${utility.format(total)} ${utility.moneyemoji}`)

            let vara = await companyService.jobs.fish.rods.get(pobj3.level)
            const result = new ContainerBuilder().setAccentColor(0x5bff45)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${disp.find(d => d == vara)?.icon || ''} ${disp.find(d => d == vara)?.name || ''}`))
            for (let i = 0; i < disp.length; i++) {
                result.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${(disp[i] == vara ? ( troca ? '🔁':'✅') : ' ')}${disp[i].icon} ${disp[i].name}**\n\`${companyService.jobs.formatStars(disp[i].stars)}\`\nGasto por turno: **${disp[i].sta} 🔸**\nProfundidade: **${disp[i].profundidade}m**\nProfundidade Máxima: **${disp[i].maxprofundidade}m**`))
            }

            result.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**✅ Sucesso na ${pobj2.rod ? 'troca' : 'compra'}**\nVocê acaba de ${pobj2.rod ? 'trocar sua vara para:' : 'comprar uma vara:'} **${vara.icon} ${vara.name}**\nPara testar sua nova vara de pesca utilize \`/pescar\`!`))
            interaction.editReply({ components: [result, ...reworkBtns(true)], flags: Discord.MessageFlags.IsComponentsV2 });
            await prisma.players.update({ where: { user_id }, data: { rod: vara } })

            collector.resetTimer();
            
        });
        
        collector.on('end', async collected => {
            if (reacted) {
                return interaction.editReply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
            }
            const result = new ContainerBuilder().setAccentColor(0xa60000).addTextDisplayComponents(new TextDisplayBuilder().setContent(`**❌ Tempo expirado**\nVocê iria ${pobj2.rod ? 'trocar sua' : 'comprar uma'} vara de pesca, porém o tempo expirou.`))
            interaction.editReply({ components: [result], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
        });


	}
};
