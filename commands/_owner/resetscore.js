const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const economyService = require('../../_classes/services/economy');
const runtime = require('../../_classes/services/runtime');
const prisma = require('../../_classes/prisma');
const { reportError } = require('../../_classes/debug');
const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder } = require('@discordjs/builders');

module.exports = {
    name: 'resetscore',
    aliases: ['resetarscore'],
    category: 'none',
    description: 'Executa um reset do banco de dados',
    options: [],
    perm: 5,
	async execute(interaction) {

        const scoremin = 80

        const buildContainer = (color, content) => new ContainerBuilder().setAccentColor(color).addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
        const initialContainer = buildContainer(0x36393f, 'Reaja para continuar o reset de temporada');

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ components: [initialContainer, new ActionRowBuilder().addComponents(btn0, btn1)], flags: Discord.MessageFlags.IsComponentsV2, withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
reacted = true;
            collector.stop();
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.resetscore.defer_update'); });
            if (b.customId == 'cancel'){
                interaction.editReply({ components: [buildContainer(0xa60000, `❌ Reset cancelado\n\nVocê cancelou o reset da temporada`)], flags: Discord.MessageFlags.IsComponentsV2 });
                return;
            }

            let resultContainer;
            try {
                const rows = await prisma.players.findMany({ where: { mastery: { gt: BigInt(0) } }, select: { user_id: true, mastery: true } });

                async function addTp(user_id, mastery) {

                    try {
                        if (mastery <= 1000) return;
                        const finalmastery = mastery > 10000 ? mastery/10000 : 1
                        await economyService.tp.add(user_id, finalmastery)
                        if (runtime.debug) console.log('add tp ' + finalmastery + ' to ' + user_id)
                    } catch (error) {
                        reportError(error, 'command.resetscore.add_tp', { userId: user_id });
                    }
                }
                
                rows.forEach(async (row) => {
                    addTp(row.user_id, parseInt(row.mastery))
                });

                    await prisma.companies.updateMany({ where: { score: { gt: scoremin } }, data: { score: scoremin } });
                    await prisma.players.updateMany({ where: { mastery: { gt: BigInt(0) } }, data: { mastery: BigInt(0) } });
    
    
                resultContainer = buildContainer(0x32a893, '✅ Temporada foi resetada!');
            } catch (e) {
                resultContainer = buildContainer(0xeb4034, `❌ Houve um erro ao tentar resetar os scores\n\n**Erro**\n\`\`\`js\n${e.stack}\n\`\`\``);
            } finally {
                await interaction.editReply({ components: [resultContainer], flags: Discord.MessageFlags.IsComponentsV2 });
            }
            
        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            interaction.editReply({ components: [buildContainer(0xa60000, '❌ Tempo expirado\n\nVocê iria resetar a temporada, porém o tempo expirou.')], flags: Discord.MessageFlags.IsComponentsV2 });
            return;
        });

	}
};
