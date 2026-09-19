const Discord = require('discord.js');
const UtilityService = require('../../_classes/services/utilityService');
const utility = new UtilityService();
const economyService = require('../../_classes/services/economy');
const runtime = require('../../_classes/services/runtime');
const Database = require("../../_classes/manager/DatabaseManager");
const DatabaseManager = new Database();
const { reportError } = require('../../_classes/debug');

module.exports = {
    name: 'resetscore',
    aliases: ['resetarscore'],
    category: 'none',
    description: 'Executa um reset do banco de dados',
    options: [],
    perm: 5,
	async execute(interaction) {

        const scoremin = 80

		        const embed = new Discord.EmbedBuilder()
        embed.setDescription('Reaja para continuar o reset de temporada')

        const btn0 = utility.createButton('confirm', 'SECONDARY', '', '✅')
        const btn1 = utility.createButton('cancel', 'SECONDARY', '', '❌')

        let embedinteraction = (await interaction.reply({ embeds: [embed], components: [utility.rowComponents([btn0, btn1])], withResponse: true })).resource.message;

        const filter = i => i.user.id === interaction.user.id;
        
        const collector = embedinteraction.createMessageComponentCollector({ filter, time: 15000 });
        let reacted = false;
        collector.on('collect', async (b) => {

            if (!(b.user.id === interaction.user.id)) return
reacted = true;
            collector.stop();
            if (b && !b.deferred) b.deferUpdate().catch((error) => { throw reportError(error, 'command.resetscore.defer_update'); });
            embed.fields = [];
            if (b.customId == 'cancel'){
                embed.setColor('#a60000');
                embed.setDescription('❌ Reset cancelado', `
                Você cancelou o reset de ` + args[0])
                interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            try {
                const rows = await DatabaseManager.findMany('players', { mastery: { gt: 0 } });

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

                await DatabaseManager.updateMany('companies', { score: { gt: scoremin } }, { score: scoremin });
                await DatabaseManager.updateMany('players', { mastery: { gt: 0 } }, { mastery: 0 });
    
                embed.setDescription(`✅ Temporada foi resetada!`)
                embed.setColor('#32a893');
    
            } catch (e) {
                embed.setDescription(`❌ Houve um erro ao tentar resetar os scores`)
                embed.addFields({ name: 'Erro', value: `\`\`\`js\n${e.stack}\`\`\`` });
                embed.setColor('#eb4034')
            } finally {
                await interaction.editReply({ embeds: [embed], components: []  });
            }
            
        });
        
        collector.on('end', async collected => {
            if (reacted) return;
            const embed = new Discord.EmbedBuilder();
            embed.setColor('#a60000');
            embed.setDescription('❌ Tempo expirado', `Você iria resetar a temporada, porém o tempo expirou.`)
            interaction.editReply({ embeds: [embed], components: []  });
            return;
        });

	}
};
