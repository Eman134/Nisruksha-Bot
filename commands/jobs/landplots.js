const Discord = require('discord.js');
const { ContainerBuilder, TextDisplayBuilder } = require('@discordjs/builders');
const clientService = require('../../_classes/services/clientService');
const townsService = require('../../_classes/services/towns');
const companyService = require('../../_classes/services/company');
const prisma = require('../../_classes/prisma');

module.exports = {
    name: 'terrenos',
    aliases: ['landplots', 'terrains', 'lotes', 'plots'],
    category: 'none',
    description: 'Visualiza as informações de todos os seus terrenos',
    mastery: 25,
    companytype: 1,
	async execute(interaction) {
        const company = await companyService.get.currentForUser(interaction.user.id);

                
        const user_id = BigInt(interaction.user.id)
        let pobj = await prisma.players.upsert({ where: { user_id }, update: { user_id }, create: { user_id, frames: [], badges: [] } })

        if (!pobj.plots || Object.keys(pobj.plots).length == 0) {
            const container = new ContainerBuilder().setAccentColor(0xb8312c).addTextDisplayComponents(new TextDisplayBuilder().setContent(`**❌ Não possui terrenos**\nUtilize \`/terrenoatual\` para adquirir um terreno`))
            await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
        }

        let x = 1
        let townnum = await townsService.getTownNum(interaction.user.id);
        let townname = await townsService.getTownName(interaction.user.id);
        for (let r of Object.keys(pobj.plots)) {

            r = pobj.plots[r]

            let areaplant = 0;
            if (r.plants) {
                for (const rarea of r.plants) {
                    areaplant += rarea.area
                }
            }
            // \nConservação do terreno: \`${r.cons}%\`
            x++
        }
        const container = new ContainerBuilder().setAccentColor(0xb8312c)
        for (const r of Object.values(pobj.plots)) {
            let areaplant = 0;
            if (r.plants) for (const rarea of r.plants) areaplant += rarea.area
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${townnum == r.loc ? '<:arrow:737370913204600853> ':''}<:terreno:765944910179336202> Terreno ${Object.values(pobj.plots).indexOf(r) + 1}**\nÁrea máxima em m²: \`${r.area}m²\`\nLotes de plantação: \`${r.plants ? r.plants.length : 0}/5\`\nÁrea com plantação: \`${areaplant}m²\`\nLocalização: \`${townsService.getTownNameByNum(r.loc)}\``))
        }
        await interaction.reply({ components: [container], flags: Discord.MessageFlags.IsComponentsV2 });

	}
};
